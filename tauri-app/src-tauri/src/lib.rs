use serde::{Deserialize, Serialize};
use std::panic;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use tauri::{Emitter, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

// Include generated build info
include!(concat!(env!("OUT_DIR"), "/build_info.rs"));

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DependencyStatus {
    pub node_available: bool,
    pub node_version: Option<String>,
    pub npm_available: bool,
    pub npm_version: Option<String>,
    pub dependencies_installed: bool,
    pub dependencies_path: Option<String>,
    pub scripts_path: Option<String>,
    pub browser_installed: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateOptions {
    pub input_path: String,
    pub output_path: Option<String>,
    pub palette: String,
    pub export_png: bool,
    pub png_drop_shadow: bool,
    pub view_mode: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GenerateResult {
    pub success: bool,
    pub html_path: Option<String>,
    pub png_path: Option<String>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProgressUpdate {
    pub step: String,
    pub progress: u8,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogEntry {
    pub level: String,      // "info", "warn", "error", "debug"
    pub source: String,     // "rust", "node", "system"
    pub message: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BuildInfo {
    pub datetime: String,
    pub commit: String,
    pub commit_short: String,
    pub branch: String,
    pub is_release: bool,
}

/// Emit a log entry to the frontend
fn emit_log(window: &tauri::Window, level: &str, source: &str, message: &str) {
    let timestamp = chrono::Local::now().format("%H:%M:%S%.3f").to_string();
    let _ = window.emit(
        "app-log",
        LogEntry {
            level: level.to_string(),
            source: source.to_string(),
            message: message.to_string(),
            timestamp,
        },
    );
}

/// Emit a log entry with error details
#[allow(dead_code)]
fn emit_error_log(window: &tauri::Window, source: &str, error: &dyn std::error::Error) {
    let message = format!("{}: {}", error, error.source().map(|e| format!(" (caused by: {})", e)).unwrap_or_default());
    emit_log(window, "error", source, &message);
}

/// Setup panic handler to capture panics and log them
pub fn setup_panic_handler(app_handle: tauri::AppHandle) {
    panic::set_hook(Box::new(move |panic_info| {
        let message = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            format!("Panic: {}", s)
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            format!("Panic: {}", s)
        } else {
            "Panic: unknown reason".to_string()
        };

        let location = if let Some(loc) = panic_info.location() {
            format!(" at {}:{}:{}", loc.file(), loc.line(), loc.column())
        } else {
            String::new()
        };

        let full_message = format!("{}{}", message, location);

        // Try to emit to all windows
        if let Some(window) = app_handle.get_webview_window("main") {
            let host_window = window.as_ref().window();
            emit_log(&host_window, "error", "rust", &full_message);
        }

        // Also log to stderr for terminal output
        eprintln!("{}", full_message);
    }));
}

/// Get the path to the user data directory for storing dependencies
fn get_user_data_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))
}

/// Get the path where dependencies (node_modules) should be installed
fn get_dependencies_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let data_dir = get_user_data_dir(app_handle)?;
    Ok(data_dir.join("dependencies"))
}

/// Check if dependencies are installed in the user data directory
fn check_dependencies_installed(app_handle: &tauri::AppHandle) -> bool {
    if let Ok(deps_dir) = get_dependencies_dir(app_handle) {
        let node_modules = deps_dir.join("node_modules");
        // Check for a key dependency that we know is required
        node_modules.exists() && node_modules.join("exceljs").exists()
    } else {
        false
    }
}

fn npm_version_from_command(command: &str) -> Option<String> {
    if command.is_empty() {
        return None;
    }

    let output = std::process::Command::new(command)
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[cfg(not(target_os = "windows"))]
fn npm_version_via_node(node_bin: &str, npm_cli: &Path) -> Option<String> {
    let output = std::process::Command::new(node_bin)
        .arg(npm_cli.to_string_lossy().to_string())
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

/// Get the path to the bundled scripts directory
fn get_scripts_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    // In development, use the parent project's scripts
    let dev_path = std::env::current_dir()
        .map(|p| p.parent().map(|pp| pp.join("scripts")).unwrap_or_default())
        .unwrap_or_default();

    if dev_path.exists() && dev_path.join("build.js").exists() {
        return Ok(dev_path);
    }

    // In production, try multiple possible locations for bundled resources
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        // Primary location: resources/scripts (explicit mapping in tauri.conf.json)
        let scripts_path = resource_dir.join("scripts");
        if scripts_path.exists() && scripts_path.join("build.js").exists() {
            return Ok(scripts_path);
        }

        // Fallback 1: scripts directly in resource directory (flat structure)
        if resource_dir.join("build.js").exists() {
            return Ok(resource_dir.clone());
        }

        // Fallback 2: Check if scripts are in a _up_ directory (macOS .app bundle structure)
        let macos_path = resource_dir.parent()
            .and_then(|p| p.parent())
            .map(|p| p.join("Resources").join("scripts"));
        if let Some(path) = macos_path {
            if path.exists() && path.join("build.js").exists() {
                return Ok(path);
            }
        }

        // Return the expected path with a helpful error message
        return Err(format!(
            "Build script not found. Checked locations:\n  - {}\n  - {}/build.js\nPlease ensure the app is properly installed.",
            scripts_path.display(),
            resource_dir.display()
        ));
    }

    Err("Failed to get resource directory. Please reinstall the application.".to_string())
}

/// Get the path to node_modules - either in user data dir or bundled with scripts
fn get_node_modules_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    // First, check user data directory (for in-app installed dependencies)
    if let Ok(deps_dir) = get_dependencies_dir(app_handle) {
        let user_node_modules = deps_dir.join("node_modules");
        if user_node_modules.exists() && user_node_modules.join("exceljs").exists() {
            return Ok(user_node_modules);
        }
    }

    // Fallback to bundled node_modules in scripts directory (development mode)
    let scripts_dir = get_scripts_dir(app_handle)?;
    let bundled_node_modules = scripts_dir.join("node_modules");
    if bundled_node_modules.exists() && bundled_node_modules.join("exceljs").exists() {
        return Ok(bundled_node_modules);
    }

    Err("Dependencies not installed. Please use the Setup button to install required dependencies.".to_string())
}

fn get_browser_install_dir(app_handle: &tauri::AppHandle) -> Option<PathBuf> {
    if let Ok(deps_dir) = get_dependencies_dir(app_handle) {
        let path = deps_dir.join("playwright-browsers");
        if path.exists() {
            return Some(path);
        }
    }

    if let Ok(scripts_dir) = get_scripts_dir(app_handle) {
        if let Some(root) = scripts_dir.parent() {
            let path = root.join("node_modules").join(".playwright");
            if path.exists() {
                return Some(path);
            }
        }
    }

    None
}

/// Get Node.js executable path
fn get_node_path(app_handle: &tauri::AppHandle) -> Result<String, String> {
    // First check for bundled Node.js in the resource directory
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let bundled_node = if cfg!(target_os = "windows") {
            resource_dir.join("node-bundle").join("node.exe")
        } else {
            resource_dir.join("node-bundle").join("node")
        };

        if bundled_node.exists() {
            return Ok(bundled_node.to_string_lossy().to_string());
        }
    }

    // Check if NODE_PATH environment variable is set
    if let Ok(path) = std::env::var("NODE_PATH") {
        if std::path::Path::new(&path).exists() {
            return Ok(path);
        }
    }

    // Build list of common node locations
    let home = std::env::var("HOME").unwrap_or_default();

    // For nvm, we need to find the actual version directory
    #[cfg(not(target_os = "windows"))]
    {
        // Check nvm versions directory for installed node versions
        let nvm_versions_dir = format!("{}/.nvm/versions/node", home);
        if let Ok(entries) = std::fs::read_dir(&nvm_versions_dir) {
            // Get the latest version (sort by name descending)
            let mut versions: Vec<_> = entries
                .filter_map(|e| e.ok())
                .filter(|e| e.path().is_dir())
                .collect();
            versions.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
            
            if let Some(latest) = versions.first() {
                let node_path = latest.path().join("bin").join("node");
                if node_path.exists() {
                    return Ok(node_path.to_string_lossy().to_string());
                }
            }
        }
    }

    let common_paths: Vec<String> = if cfg!(target_os = "windows") {
        vec![
            "node.exe".to_string(),
            "C:\\Program Files\\nodejs\\node.exe".to_string(),
            "C:\\Program Files (x86)\\nodejs\\node.exe".to_string(),
        ]
    } else {
        vec![
            "/usr/local/bin/node".to_string(),
            "/opt/homebrew/bin/node".to_string(),
            "/usr/bin/node".to_string(),
            "/opt/local/bin/node".to_string(),
            // NVM default/current symlink
            format!("{}/.nvm/current/bin/node", home),
            // Volta paths
            format!("{}/.volta/bin/node", home),
        ]
    };

    // Try each path
    for path in &common_paths {
        if std::path::Path::new(path).exists() {
            return Ok(path.clone());
        }
    }

    // Try using 'which' command on Unix systems to find node
    #[cfg(not(target_os = "windows"))]
    {
        // First try sourcing nvm and then finding node
        let nvm_find = format!(
            r#"
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 2>/dev/null
            which node 2>/dev/null || command -v node 2>/dev/null
            "#
        );
        
        if let Ok(output) = std::process::Command::new("bash")
            .args(["-c", &nvm_find])
            .output()
        {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() && std::path::Path::new(&path).exists() {
                    return Ok(path);
                }
            }
        }
        
        // Fallback to simple which
        if let Ok(output) = std::process::Command::new("sh")
            .args(["-c", "which node 2>/dev/null || command -v node 2>/dev/null"])
            .output()
        {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() && std::path::Path::new(&path).exists() {
                    return Ok(path);
                }
            }
        }
    }

    // Last resort: try 'node' and hope it's in PATH
    // This won't work in Tauri bundled app without a login shell
    Err("Node.js not found. Please install Node.js and ensure it's in your PATH, or set the NODE_PATH environment variable.".to_string())
}

#[tauri::command]
async fn generate_gantt(
    app_handle: tauri::AppHandle,
    options: GenerateOptions,
    window: tauri::Window,
) -> Result<GenerateResult, String> {
    emit_log(&window, "info", "rust", "Starting Gantt chart generation...");
    emit_log(&window, "debug", "rust", &format!("Options: input={}, palette={}, export_png={}, view_mode={}",
        options.input_path, options.palette, options.export_png, options.view_mode));

    let scripts_dir = get_scripts_dir(&app_handle)?;
    emit_log(&window, "debug", "rust", &format!("Scripts directory: {}", scripts_dir.display()));

    let build_script = scripts_dir.join("build.js");

    if !build_script.exists() {
        let err = format!("Build script not found at: {}", build_script.display());
        emit_log(&window, "error", "rust", &err);
        return Err(err);
    }
    emit_log(&window, "debug", "rust", &format!("Build script found: {}", build_script.display()));

    // Emit progress update
    let _ = window.emit(
        "generation-progress",
        ProgressUpdate {
            step: "Starting generation...".to_string(),
            progress: 10,
        },
    );

    let node = get_node_path(&app_handle)?;
    emit_log(&window, "info", "rust", &format!("Using Node.js: {}", node));
    let mut args = vec![
        build_script.to_string_lossy().to_string(),
        "--input".to_string(),
        options.input_path.clone(),
        "--palette".to_string(),
        options.palette.clone(),
        "--view-mode".to_string(),
        options.view_mode.clone(),
    ];

    if let Some(output) = &options.output_path {
        args.push("--output".to_string());
        args.push(output.clone());
    }

    // Add PNG export flag
    if options.export_png {
        args.push("--png".to_string());
    } else {
        args.push("--no-png".to_string());
    }
    
    // Add drop shadow flag if enabled
    if options.png_drop_shadow {
        args.push("--drop-shadow".to_string());
    }

    let _ = window.emit(
        "generation-progress",
        ProgressUpdate {
            step: "Running build script...".to_string(),
            progress: 30,
        },
    );

    // Set up environment for the node process
    let mut cmd = Command::new(&node);
    cmd.args(&args)
        .current_dir(scripts_dir.parent().unwrap_or(&scripts_dir))
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // Set NODE_PATH to include user-installed dependencies if available
    if let Ok(node_modules) = get_node_modules_dir(&app_handle) {
        cmd.env("NODE_PATH", node_modules.parent().unwrap_or(&node_modules));
    }

    if let Some(browser_dir) = get_browser_install_dir(&app_handle) {
        cmd.env("PLAYWRIGHT_BROWSERS_PATH", browser_dir);
    }

    emit_log(&window, "debug", "rust", &format!("Running: {} {}", node, args.join(" ")));

    let mut child = cmd
        .spawn()
        .map_err(|e| {
            let err = format!("Failed to start node process: {}", e);
            emit_log(&window, "error", "rust", &err);
            err
        })?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;

    let mut stdout_reader = BufReader::new(stdout).lines();
    let mut stderr_reader = BufReader::new(stderr).lines();

    let mut output_lines = Vec::new();
    let mut error_lines = Vec::new();
    let mut html_path: Option<String> = None;
    let mut png_path: Option<String> = None;

    // Read stdout
    while let Ok(Some(line)) = stdout_reader.next_line().await {
        output_lines.push(line.clone());
        emit_log(&window, "debug", "node", &line);

        // Parse output to find generated file paths
        if line.contains("Generated:") || line.contains("Output:") || line.contains("Generated PNG") || line.contains("Generated HTML") {
            if line.ends_with(".html") {
                html_path = Some(line.split_whitespace().last().unwrap_or("").to_string());
                emit_log(&window, "info", "node", &format!("HTML generated: {}", html_path.as_ref().unwrap_or(&String::new())));
            } else if line.ends_with(".png") {
                png_path = Some(line.split_whitespace().last().unwrap_or("").to_string());
                emit_log(&window, "info", "node", &format!("PNG generated: {}", png_path.as_ref().unwrap_or(&String::new())));
            }
        }

        // Update progress based on output
        if line.contains("Parsing") {
            let _ = window.emit(
                "generation-progress",
                ProgressUpdate {
                    step: "Parsing input file...".to_string(),
                    progress: 40,
                },
            );
        } else if line.contains("Generating HTML") {
            let _ = window.emit(
                "generation-progress",
                ProgressUpdate {
                    step: "Generating HTML...".to_string(),
                    progress: 60,
                },
            );
        } else if line.contains("Exporting PNG") {
            let _ = window.emit(
                "generation-progress",
                ProgressUpdate {
                    step: "Exporting PNG...".to_string(),
                    progress: 80,
                },
            );
        }
    }

    // Read stderr
    while let Ok(Some(line)) = stderr_reader.next_line().await {
        error_lines.push(line.clone());
        if !line.trim().is_empty() {
            emit_log(&window, "warn", "node", &line);
        }
    }

    let status = child
        .wait()
        .await
        .map_err(|e| {
            let err = format!("Failed to wait for process: {}", e);
            emit_log(&window, "error", "rust", &err);
            err
        })?;

    emit_log(&window, "info", "rust", &format!("Build process exited with status: {:?}", status));

    let _ = window.emit(
        "generation-progress",
        ProgressUpdate {
            step: if status.success() {
                "Complete!"
            } else {
                "Failed"
            }
            .to_string(),
            progress: 100,
        },
    );

    if status.success() {
        // Try to extract paths from output if not already found
        if html_path.is_none() {
            for line in &output_lines {
                if line.ends_with(".html") && (line.contains("output") || line.contains("Output") || line.contains("Generated HTML") || line.contains("Generated:")) {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if let Some(path) = parts.last() {
                        html_path = Some(path.to_string());
                    }
                }
            }
        }

        // Try to extract PNG path from output if not already found
        if png_path.is_none() && options.export_png {
            for line in &output_lines {
                if line.ends_with(".png") && (line.contains("Generated PNG") || line.contains("Generated:") || line.contains("PNG")) {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    // Look for the path (usually the last word that ends with .png)
                    for part in parts.iter().rev() {
                        if part.ends_with(".png") {
                            png_path = Some(part.to_string());
                            break;
                        }
                    }
                }
            }
        }

        Ok(GenerateResult {
            success: true,
            html_path,
            png_path,
            message: output_lines.join("\n"),
        })
    } else {
        Err(format!(
            "Generation failed:\n{}",
            if error_lines.is_empty() {
                output_lines.join("\n")
            } else {
                error_lines.join("\n")
            }
        ))
    }
}

#[tauri::command]
async fn read_json_file(path: String, window: tauri::Window) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| {
            let err_msg = format!("Failed to read file {}: {}", path, e);
            emit_log(&window, "error", "rust", &err_msg);
            err_msg
        })
}

#[tauri::command]
async fn validate_input_file(path: String, window: tauri::Window) -> Result<bool, String> {
    let path = PathBuf::from(&path);

    if !path.exists() {
        let err = format!("File does not exist: {}", path.display());
        emit_log(&window, "error", "rust", &err);
        return Err(err);
    }

    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match extension.as_str() {
        "json" | "xlsx" => {
            emit_log(&window, "debug", "rust", &format!("File validated: {}", path.display()));
            Ok(true)
        }
        _ => {
            let err = format!("Invalid file type: .{}. Expected .json or .xlsx", extension);
            emit_log(&window, "error", "rust", &err);
            Err(err)
        }
    }
}

#[tauri::command]
async fn parse_file(path: String, app_handle: tauri::AppHandle, window: tauri::Window) -> Result<String, String> {
    let file_path = PathBuf::from(&path);
    
    if !file_path.exists() {
        let err = format!("File does not exist: {}", file_path.display());
        emit_log(&window, "error", "rust", &err);
        return Err(err);
    }

    let extension = file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match extension.as_str() {
        "json" => {
            // For JSON files, just read and return the content
            tokio::fs::read_to_string(&path)
                .await
                .map_err(|e| {
                    let err_msg = format!("Failed to read JSON file {}: {}", path, e);
                    emit_log(&window, "error", "rust", &err_msg);
                    err_msg
                })
        }
        "xlsx" | "xls" => {
            // For Excel files, use Node.js to parse
            let scripts_dir = get_scripts_dir(&app_handle)?;
            let parse_script = scripts_dir.join("parse-file.js");
            
            if !parse_script.exists() {
                let err = format!("Parse script not found at: {}", parse_script.display());
                emit_log(&window, "error", "rust", &err);
                return Err(err);
            }

            let node = get_node_path(&app_handle)?;
            
            let mut cmd = Command::new(&node);
            cmd.arg(parse_script.to_string_lossy().to_string())
                .arg(&path)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped());

            // Set NODE_PATH to include user-installed dependencies if available
            if let Ok(node_modules) = get_node_modules_dir(&app_handle) {
                cmd.env("NODE_PATH", node_modules.parent().unwrap_or(&node_modules));
            }

            emit_log(&window, "debug", "rust", &format!("Parsing Excel file: {}", path));

            let output = cmd
                .output()
                .await
                .map_err(|e| {
                    let err = format!("Failed to run parse script: {}", e);
                    emit_log(&window, "error", "rust", &err);
                    err
                })?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                let err = format!("Failed to parse Excel file: {}", stderr);
                emit_log(&window, "error", "rust", &err);
                return Err(err);
            }

            let stdout = String::from_utf8_lossy(&output.stdout);
            Ok(stdout.to_string())
        }
        _ => {
            let err = format!("Unsupported file type for parsing: {}", extension);
            emit_log(&window, "error", "rust", &err);
            Err(err)
        }
    }
}

#[tauri::command]
fn get_palette_info() -> Vec<PaletteInfo> {
    vec![
        PaletteInfo {
            id: "alternating".to_string(),
            name: "Alternating (Default)".to_string(),
            description: "Best task differentiation with red/purple mix".to_string(),
            colors: vec![
                "#F01840".to_string(),
                "#402848".to_string(),
                "#C01830".to_string(),
                "#705E74".to_string(),
                "#901226".to_string(),
            ],
            accent_border: None,
            accent_color: None,
        },
        PaletteInfo {
            id: "alternating_b".to_string(),
            name: "Alternating + Border".to_string(),
            description: "Alternating with red left border accent".to_string(),
            colors: vec![
                "#F01840".to_string(),
                "#402848".to_string(),
                "#C01830".to_string(),
                "#705E74".to_string(),
                "#901226".to_string(),
            ],
            accent_border: Some("#C01830".to_string()),
            accent_color: None,
        },
        PaletteInfo {
            id: "reds".to_string(),
            name: "Reds".to_string(),
            description: "Warm, energetic red gradient".to_string(),
            colors: vec![
                "#F01840".to_string(),
                "#C01830".to_string(),
                "#901226".to_string(),
                "#600C1C".to_string(),
                "#300810".to_string(),
            ],
            accent_border: None,
            accent_color: None,
        },
        PaletteInfo {
            id: "reds_b".to_string(),
            name: "Reds + Purple Border".to_string(),
            description: "Red gradient with purple left border".to_string(),
            colors: vec![
                "#F01840".to_string(),
                "#C01830".to_string(),
                "#901226".to_string(),
                "#600C1C".to_string(),
                "#300810".to_string(),
            ],
            accent_border: Some("#402848".to_string()),
            accent_color: None,
        },
        PaletteInfo {
            id: "purples_a".to_string(),
            name: "Purples + Burgundy Text".to_string(),
            description: "Purple gradient with burgundy task names".to_string(),
            colors: vec![
                "#705E74".to_string(),
                "#402848".to_string(),
                "#2A1C30".to_string(),
            ],
            accent_border: None,
            accent_color: Some("#901226".to_string()),
        },
        PaletteInfo {
            id: "purples_b".to_string(),
            name: "Purples + Red Border".to_string(),
            description: "Purple gradient with red left border".to_string(),
            colors: vec![
                "#705E74".to_string(),
                "#402848".to_string(),
                "#2A1C30".to_string(),
            ],
            accent_border: Some("#C01830".to_string()),
            accent_color: None,
        },
        PaletteInfo {
            id: "purples_c".to_string(),
            name: "Purples + Both Accents".to_string(),
            description: "Purple with burgundy text and red border".to_string(),
            colors: vec![
                "#705E74".to_string(),
                "#402848".to_string(),
                "#2A1C30".to_string(),
            ],
            accent_border: Some("#C01830".to_string()),
            accent_color: Some("#901226".to_string()),
        },
    ]
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaletteInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub colors: Vec<String>,
    pub accent_border: Option<String>,
    pub accent_color: Option<String>,
}

/// Check if Node.js and npm are available, and if dependencies are installed
#[tauri::command]
async fn check_dependencies(app_handle: tauri::AppHandle) -> Result<DependencyStatus, String> {
    let mut status = DependencyStatus {
        node_available: false,
        node_version: None,
        npm_available: false,
        npm_version: None,
        dependencies_installed: false,
        dependencies_path: None,
        scripts_path: None,
        browser_installed: false,
    };

    // Check Node.js
    if let Ok(node_path) = get_node_path(&app_handle) {
        // Try to get version
        if let Ok(output) = std::process::Command::new(&node_path)
            .arg("--version")
            .output()
        {
            if output.status.success() {
                status.node_available = true;
                status.node_version = Some(
                    String::from_utf8_lossy(&output.stdout)
                        .trim()
                        .to_string(),
                );
            }
        }
    }

    // Check npm (look for it relative to node or in PATH)
    let npm_cmd = if cfg!(target_os = "windows") {
        "npm.cmd"
    } else {
        "npm"
    };

    // Try common npm locations
    let home = std::env::var("HOME").unwrap_or_default();
    let npm_paths: Vec<String> = if cfg!(target_os = "windows") {
        vec![
            npm_cmd.to_string(),
            "C:\\Program Files\\nodejs\\npm.cmd".to_string(),
        ]
    } else {
        vec![
            "/usr/local/bin/npm".to_string(),
            "/opt/homebrew/bin/npm".to_string(),
            "/usr/bin/npm".to_string(),
            format!("{}/.nvm/current/bin/npm", home),
            format!("{}/.volta/bin/npm", home),
        ]
    };

    for npm_path in &npm_paths {
        if let Some(version) = npm_version_from_command(npm_path) {
            status.npm_available = true;
            status.npm_version = Some(version);
            break;
        }
    }

    // If npm still isn't resolved, look relative to the detected Node.js binary
    if !status.npm_available {
        if let Ok(node_path) = get_node_path(&app_handle) {
            if let Some(node_dir) = Path::new(&node_path).parent() {
                let candidate = node_dir.join(npm_cmd);
                let candidate_str = candidate.to_string_lossy().to_string();
                if let Some(version) = npm_version_from_command(&candidate_str) {
                    status.npm_available = true;
                    status.npm_version = Some(version);
                } else {
                    // For installs like nvm, npm may live under ../lib/node_modules/npm/bin/npm-cli.js
                    #[cfg(not(target_os = "windows"))]
                    {
                        if let Some(grandparent) = node_dir.parent() {
                            let npm_cli = grandparent
                                .join("lib")
                                .join("node_modules")
                                .join("npm")
                                .join("bin")
                                .join("npm-cli.js");
                            if npm_cli.exists() {
                                if let Some(version) = npm_version_via_node(&node_path, &npm_cli) {
                                    status.npm_available = true;
                                    status.npm_version = Some(version);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Also try which/where to find npm
    if !status.npm_available {
        #[cfg(not(target_os = "windows"))]
        {
            if let Ok(output) = std::process::Command::new("sh")
                .args(["-c", "which npm 2>/dev/null || command -v npm 2>/dev/null"])
                .output()
            {
                if output.status.success() {
                    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if !path.is_empty() {
                        if let Ok(ver_output) = std::process::Command::new(&path)
                            .arg("--version")
                            .output()
                        {
                            if ver_output.status.success() {
                                status.npm_available = true;
                                status.npm_version = Some(
                                    String::from_utf8_lossy(&ver_output.stdout)
                                        .trim()
                                        .to_string(),
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    // Check if dependencies are installed
    status.dependencies_installed = check_dependencies_installed(&app_handle);

    // Get paths for display
    if let Ok(deps_dir) = get_dependencies_dir(&app_handle) {
        status.dependencies_path = Some(deps_dir.to_string_lossy().to_string());
    }
    if let Ok(scripts_dir) = get_scripts_dir(&app_handle) {
        status.scripts_path = Some(scripts_dir.to_string_lossy().to_string());
    }

    status.browser_installed = get_browser_install_dir(&app_handle).is_some();

    Ok(status)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InstallProgress {
    pub stage: String,
    pub message: String,
    pub progress: u8,
    pub complete: bool,
    pub error: Option<String>,
}

/// Install dependencies by running npm install
#[tauri::command]
async fn install_dependencies(
    app_handle: tauri::AppHandle,
    window: tauri::Window,
) -> Result<bool, String> {
    // Emit initial progress
    let _ = window.emit(
        "install-progress",
        InstallProgress {
            stage: "Preparing".to_string(),
            message: "Setting up dependency directory...".to_string(),
            progress: 5,
            complete: false,
            error: None,
        },
    );

    // Get the scripts directory to find package.json
    let scripts_dir = get_scripts_dir(&app_handle)?;
    let package_json = scripts_dir.join("package.json");

    if !package_json.exists() {
        return Err(format!(
            "package.json not found at {}",
            package_json.display()
        ));
    }

    // Create dependencies directory in user data
    let deps_dir = get_dependencies_dir(&app_handle)?;
    tokio::fs::create_dir_all(&deps_dir)
        .await
        .map_err(|e| format!("Failed to create dependencies directory: {}", e))?;

    // Copy package.json and package-lock.json to deps directory
    let _ = window.emit(
        "install-progress",
        InstallProgress {
            stage: "Copying".to_string(),
            message: "Copying package files...".to_string(),
            progress: 10,
            complete: false,
            error: None,
        },
    );

    tokio::fs::copy(&package_json, deps_dir.join("package.json"))
        .await
        .map_err(|e| format!("Failed to copy package.json: {}", e))?;

    // Copy package-lock.json if it exists
    let package_lock = scripts_dir.join("package-lock.json");
    if package_lock.exists() {
        let _ = tokio::fs::copy(&package_lock, deps_dir.join("package-lock.json")).await;
    }

    // Find npm and node
    let npm_cmd = find_npm_path()?;
    let node_path = get_node_path(&app_handle)?;
    let node_dir = std::path::Path::new(&node_path)
        .parent()
        .map(|p| p.to_string_lossy().to_string());

    let _ = window.emit(
        "install-progress",
        InstallProgress {
            stage: "Installing".to_string(),
            message: "Installing dependencies (this may take a few minutes)...".to_string(),
            progress: 20,
            complete: false,
            error: None,
        },
    );

    // Run npm install
    let mut npm_cmd_builder = Command::new(&npm_cmd);
    npm_cmd_builder
        .args(["install", "--production"])
        .current_dir(&deps_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if let Some(node_dir) = node_dir {
        let separator = if cfg!(target_os = "windows") { ";" } else { ":" };
        let existing_path = std::env::var("PATH").unwrap_or_default();
        let path_value = if existing_path.is_empty() {
            node_dir.clone()
        } else if existing_path
            .split(separator)
            .any(|segment| segment == node_dir)
        {
            existing_path
        } else {
            format!("{}{}{}", node_dir, separator, existing_path)
        };
        npm_cmd_builder.env("PATH", path_value);
    }

    let mut child = npm_cmd_builder
        .spawn()
        .map_err(|e| format!("Failed to start npm install: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;

    let mut stdout_reader = BufReader::new(stdout).lines();
    let mut progress = 20u8;

    // Read stdout and update progress
    while let Ok(Some(line)) = stdout_reader.next_line().await {
        // Update progress based on npm output
        if line.contains("added") || line.contains("packages") {
            progress = progress.saturating_add(10).min(90);
        }
        let _ = window.emit(
            "install-progress",
            InstallProgress {
                stage: "Installing".to_string(),
                message: line,
                progress,
                complete: false,
                error: None,
            },
        );
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Failed to wait for npm: {}", e))?;

    // Read stderr for error messages
    let mut error_lines = Vec::new();
    let mut stderr_reader = BufReader::new(stderr).lines();
    while let Ok(Some(line)) = stderr_reader.next_line().await {
        if !line.contains("WARN") && !line.is_empty() {
            error_lines.push(line);
        }
    }

    if status.success() {
        let _ = window.emit(
            "install-progress",
            InstallProgress {
                stage: "Complete".to_string(),
                message: "Dependencies installed. Install the internal browser to enable PNG export.".to_string(),
                progress: 100,
                complete: true,
                error: None,
            },
        );
        Ok(true)
    } else {
        let error_msg = if error_lines.is_empty() {
            "npm install failed".to_string()
        } else {
            error_lines.join("\n")
        };
        let _ = window.emit(
            "install-progress",
            InstallProgress {
                stage: "Error".to_string(),
                message: "Installation failed".to_string(),
                progress: 100,
                complete: true,
                error: Some(error_msg.clone()),
            },
        );
        Err(error_msg)
    }
}

async fn install_playwright_runtime(
    app_handle: &tauri::AppHandle,
    window: &tauri::Window,
    npm_cmd: &str,
    node_path: &str,
    deps_dir: &Path,
) -> Result<(), String> {
    if get_browser_install_dir(app_handle).is_some() {
        return Ok(());
    }

    let browser_dir = deps_dir.join("playwright-browsers");
    let _ = window.emit(
        "install-progress",
        InstallProgress {
            stage: "Installing".to_string(),
            message: "Installing Chromium runtime for PNG export...".to_string(),
            progress: 92,
            complete: false,
            error: None,
        },
    );

    let mut browser_cmd = Command::new(npm_cmd);
    browser_cmd
        .args(["exec", "playwright", "install", "chromium"])
        .current_dir(deps_dir)
        .env("PLAYWRIGHT_BROWSERS_PATH", &browser_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if cfg!(target_os = "linux") {
        browser_cmd.arg("--with-deps");
    }

    if let Some(node_dir) = Path::new(node_path).parent() {
        let separator = if cfg!(target_os = "windows") { ";" } else { ":" };
        let existing_path = std::env::var("PATH").unwrap_or_default();
        let node_dir_str = node_dir.to_string_lossy();
        let path_value = if existing_path.is_empty() {
            node_dir_str.to_string()
        } else if existing_path
            .split(separator)
            .any(|segment| segment == node_dir_str)
        {
            existing_path
        } else {
            format!("{}{}{}", node_dir_str, separator, existing_path)
        };
        browser_cmd.env("PATH", path_value);
    }

    let mut browser_child = browser_cmd
        .spawn()
        .map_err(|e| format!("Failed to start Playwright install: {}", e))?;

    let browser_stdout = browser_child
        .stdout
        .take()
        .ok_or("Failed to capture browser install stdout")?;
    let browser_stderr = browser_child
        .stderr
        .take()
        .ok_or("Failed to capture browser install stderr")?;

    let mut browser_stdout_reader = BufReader::new(browser_stdout).lines();
    while let Ok(Some(line)) = browser_stdout_reader.next_line().await {
        if !line.trim().is_empty() {
            let _ = window.emit(
                "install-progress",
                InstallProgress {
                    stage: "Installing".to_string(),
                    message: line,
                    progress: 95,
                    complete: false,
                    error: None,
                },
            );
        }
    }

    let browser_status = browser_child
        .wait()
        .await
        .map_err(|e| format!("Playwright install failed: {}", e))?;

    if !browser_status.success() {
        let mut err_lines = Vec::new();
        let mut browser_stderr_reader = BufReader::new(browser_stderr).lines();
        while let Ok(Some(line)) = browser_stderr_reader.next_line().await {
            if !line.trim().is_empty() {
                err_lines.push(line);
            }
        }
        let err_msg = if err_lines.is_empty() {
            "Failed to install Chromium runtime for PNG export".to_string()
        } else {
            err_lines.join("\n")
        };
        let _ = window.emit(
            "install-progress",
            InstallProgress {
                stage: "Error".to_string(),
                message: "Installation failed".to_string(),
                progress: 100,
                complete: true,
                error: Some(err_msg.clone()),
            },
        );
        return Err(err_msg);
    }

    if !browser_dir.exists() {
        let _ = std::fs::create_dir_all(&browser_dir);
    }

    Ok(())
}

#[tauri::command]
async fn install_browser_runtime(
    app_handle: tauri::AppHandle,
    window: tauri::Window,
) -> Result<bool, String> {
    if !check_dependencies_installed(&app_handle) {
        return Err("Install dependencies first before installing the PNG browser runtime.".to_string());
    }

    let deps_dir = get_dependencies_dir(&app_handle)?;
    let npm_cmd = find_npm_path()?;
    let node_path = get_node_path(&app_handle)?;

    install_playwright_runtime(&app_handle, &window, &npm_cmd, &node_path, &deps_dir).await?;

    let _ = window.emit(
        "install-progress",
        InstallProgress {
            stage: "Complete".to_string(),
            message: "PNG browser runtime installed successfully.".to_string(),
            progress: 100,
            complete: true,
            error: None,
        },
    );

    Ok(true)
}

/// Install Node.js via nvm (macOS/Linux) or Chocolatey (Windows)
#[tauri::command]
async fn install_node(
    window: tauri::Window,
) -> Result<bool, String> {
    let _ = window.emit(
        "install-progress",
        InstallProgress {
            stage: "Installing".to_string(),
            message: "Installing Node.js...".to_string(),
            progress: 10,
            complete: false,
            error: None,
        },
    );

    #[cfg(target_os = "windows")]
    {
        // Windows: Use Chocolatey to install Node.js
        let _ = window.emit(
            "install-progress",
            InstallProgress {
                stage: "Installing".to_string(),
                message: "Installing Chocolatey package manager...".to_string(),
                progress: 20,
                complete: false,
                error: None,
            },
        );

        // First, install Chocolatey if not present
        let choco_check = std::process::Command::new("powershell")
            .args(["-Command", "Get-Command choco -ErrorAction SilentlyContinue"])
            .output();

        let choco_installed = choco_check.map(|o| o.status.success()).unwrap_or(false);

        if !choco_installed {
            let choco_install = Command::new("powershell")
                .args(["-ExecutionPolicy", "Bypass", "-Command", 
                    "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn();

            match choco_install {
                Ok(mut child) => {
                    let status = child.wait().await.map_err(|e| format!("Failed to install Chocolatey: {}", e))?;
                    if !status.success() {
                        return Err("Chocolatey installation failed. Please run as administrator.".to_string());
                    }
                }
                Err(e) => return Err(format!("Failed to start Chocolatey installer: {}", e)),
            }
        }

        let _ = window.emit(
            "install-progress",
            InstallProgress {
                stage: "Installing".to_string(),
                message: "Installing Node.js via Chocolatey...".to_string(),
                progress: 50,
                complete: false,
                error: None,
            },
        );

        // Install Node.js via Chocolatey
        let mut node_install = Command::new("choco")
            .args(["install", "nodejs", "--version=24.12.0", "-y"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start Node.js installation: {}", e))?;

        let status = node_install.wait().await.map_err(|e| format!("Node.js installation failed: {}", e))?;
        
        if !status.success() {
            return Err("Node.js installation via Chocolatey failed. Please run as administrator.".to_string());
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // macOS/Linux: Use nvm to install Node.js
        let home = std::env::var("HOME").unwrap_or_default();
        let nvm_dir = format!("{}/.nvm", home);
        
        // Check if nvm is already installed
        let nvm_exists = std::path::Path::new(&nvm_dir).exists();
        
        if !nvm_exists {
            let _ = window.emit(
                "install-progress",
                InstallProgress {
                    stage: "Installing".to_string(),
                    message: "Downloading nvm (Node Version Manager)...".to_string(),
                    progress: 20,
                    complete: false,
                    error: None,
                },
            );

            // Download and install nvm
            let nvm_install = Command::new("sh")
                .args(["-c", "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash"])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn();

            match nvm_install {
                Ok(mut child) => {
                    let status = child.wait().await.map_err(|e| format!("Failed to install nvm: {}", e))?;
                    if !status.success() {
                        return Err("nvm installation failed. Please check your internet connection.".to_string());
                    }
                }
                Err(e) => return Err(format!("Failed to start nvm installer: {}", e)),
            }
        }

        let _ = window.emit(
            "install-progress",
            InstallProgress {
                stage: "Installing".to_string(),
                message: "Installing Node.js v24 via nvm...".to_string(),
                progress: 50,
                complete: false,
                error: None,
            },
        );

        // Source nvm and install Node.js 24
        let nvm_script = format!(
            r#"
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            nvm install 24
            nvm use 24
            nvm alias default 24
            "#
        );

        let mut node_install = Command::new("bash")
            .args(["-c", &nvm_script])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start Node.js installation: {}", e))?;

        let stdout = node_install.stdout.take().ok_or("Failed to capture stdout")?;
        let mut stdout_reader = BufReader::new(stdout).lines();

        while let Ok(Some(line)) = stdout_reader.next_line().await {
            if !line.trim().is_empty() {
                let _ = window.emit(
                    "install-progress",
                    InstallProgress {
                        stage: "Installing".to_string(),
                        message: line,
                        progress: 70,
                        complete: false,
                        error: None,
                    },
                );
            }
        }

        let status = node_install.wait().await.map_err(|e| format!("Node.js installation failed: {}", e))?;
        
        if !status.success() {
            return Err("Node.js installation via nvm failed.".to_string());
        }
    }

    let _ = window.emit(
        "install-progress",
        InstallProgress {
            stage: "Complete".to_string(),
            message: "Node.js installed successfully!".to_string(),
            progress: 100,
            complete: true,
            error: None,
        },
    );

    Ok(true)
}

/// Find npm executable path
fn find_npm_path() -> Result<String, String> {
    let home = std::env::var("HOME").unwrap_or_default();

    let npm_paths: Vec<String> = if cfg!(target_os = "windows") {
        vec![
            "npm.cmd".to_string(),
            "C:\\Program Files\\nodejs\\npm.cmd".to_string(),
        ]
    } else {
        vec![
            "/usr/local/bin/npm".to_string(),
            "/opt/homebrew/bin/npm".to_string(),
            "/usr/bin/npm".to_string(),
            format!("{}/.nvm/current/bin/npm", home),
            format!("{}/.volta/bin/npm", home),
        ]
    };

    for path in &npm_paths {
        if std::path::Path::new(path).exists() {
            return Ok(path.clone());
        }
    }

    // Try using which command
    #[cfg(not(target_os = "windows"))]
    {
        if let Ok(output) = std::process::Command::new("sh")
            .args(["-c", "which npm 2>/dev/null || command -v npm 2>/dev/null"])
            .output()
        {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() && std::path::Path::new(&path).exists() {
                    return Ok(path);
                }
            }
        }
    }

    Err("npm not found. Please install Node.js (which includes npm) from https://nodejs.org".to_string())
}

/// Get the path where dependencies will be installed (for UI display)
#[tauri::command]
async fn get_dependencies_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    get_dependencies_dir(&app_handle).map(|p| p.to_string_lossy().to_string())
}

/// Get build information (datetime, commit, release status)
#[tauri::command]
fn get_build_info() -> BuildInfo {
    BuildInfo {
        datetime: BUILD_DATETIME.to_string(),
        commit: BUILD_COMMIT.to_string(),
        commit_short: BUILD_COMMIT.chars().take(7).collect(),
        branch: BUILD_BRANCH.to_string(),
        is_release: IS_RELEASE,
    }
}

/// Open a file with the system's default application
#[tauri::command]
async fn open_file(path: String) -> Result<(), String> {
    let path = std::path::PathBuf::from(&path);
    if !path.exists() {
        return Err(format!("File not found: {}", path.display()));
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    Ok(())
}

/// Open a folder in the system's file browser
#[tauri::command]
async fn open_folder(path: String) -> Result<(), String> {
    let path = std::path::PathBuf::from(&path);

    // If path is a file, get its parent directory
    let folder_path = if path.is_file() {
        path.parent()
            .map(|p| p.to_path_buf())
            .unwrap_or(path.clone())
    } else {
        path.clone()
    };

    if !folder_path.exists() {
        return Err(format!("Folder not found: {}", folder_path.display()));
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    Ok(())
}

/// Open a folder and select/highlight a specific file
#[tauri::command]
async fn reveal_file(path: String) -> Result<(), String> {
    let path = std::path::PathBuf::from(&path);
    if !path.exists() {
        return Err(format!("File not found: {}", path.display()));
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path.to_string_lossy()])
            .spawn()
            .map_err(|e| format!("Failed to reveal file: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path.to_string_lossy()])
            .spawn()
            .map_err(|e| format!("Failed to reveal file: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // On Linux, just open the parent folder
        if let Some(parent) = path.parent() {
            std::process::Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| format!("Failed to open folder: {}", e))?;
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            generate_gantt,
            read_json_file,
            validate_input_file,
            parse_file,
            get_palette_info,
            check_dependencies,
            install_dependencies,
            install_browser_runtime,
            install_node,
            get_dependencies_path,
            open_file,
            open_folder,
            reveal_file,
            get_build_info
        ])
        .setup(|app| {
            // Setup panic handler after app is created
            setup_panic_handler(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
