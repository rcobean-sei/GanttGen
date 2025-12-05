use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Stdio;
use tauri::{Emitter, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateOptions {
    pub input_path: String,
    pub output_path: Option<String>,
    pub palette: String,
    pub export_png: bool,
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

/// Get the path to the bundled scripts directory
fn get_scripts_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    // In development, use the parent project's scripts
    let dev_path = std::env::current_dir()
        .map(|p| p.parent().map(|pp| pp.join("scripts")).unwrap_or_default())
        .unwrap_or_default();

    if dev_path.exists() {
        return Ok(dev_path);
    }

    // In production, use bundled resources
    app_handle
        .path()
        .resource_dir()
        .map(|p| p.join("scripts"))
        .map_err(|e| format!("Failed to get resource directory: {}", e))
}

/// Get Node.js executable path
fn get_node_path() -> String {
    // Try common node paths
    if cfg!(target_os = "windows") {
        std::env::var("NODE_PATH").unwrap_or_else(|_| "node.exe".to_string())
    } else {
        std::env::var("NODE_PATH").unwrap_or_else(|_| "node".to_string())
    }
}

#[tauri::command]
async fn generate_gantt(
    app_handle: tauri::AppHandle,
    options: GenerateOptions,
    window: tauri::Window,
) -> Result<GenerateResult, String> {
    let scripts_dir = get_scripts_dir(&app_handle)?;
    let build_script = scripts_dir.join("build.js");

    if !build_script.exists() {
        return Err(format!(
            "Build script not found at: {}",
            build_script.display()
        ));
    }

    // Emit progress update
    let _ = window.emit(
        "generation-progress",
        ProgressUpdate {
            step: "Starting generation...".to_string(),
            progress: 10,
        },
    );

    let node = get_node_path();
    let mut args = vec![
        build_script.to_string_lossy().to_string(),
        "--input".to_string(),
        options.input_path.clone(),
        "--palette".to_string(),
        options.palette.clone(),
    ];

    if let Some(output) = &options.output_path {
        args.push("--output".to_string());
        args.push(output.clone());
    }

    let _ = window.emit(
        "generation-progress",
        ProgressUpdate {
            step: "Running build script...".to_string(),
            progress: 30,
        },
    );

    let mut child = Command::new(&node)
        .args(&args)
        .current_dir(scripts_dir.parent().unwrap_or(&scripts_dir))
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start node process: {}", e))?;

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

        // Parse output to find generated file paths
        if line.contains("Generated:") || line.contains("Output:") {
            if line.ends_with(".html") {
                html_path = Some(line.split_whitespace().last().unwrap_or("").to_string());
            } else if line.ends_with(".png") {
                png_path = Some(line.split_whitespace().last().unwrap_or("").to_string());
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
        error_lines.push(line);
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Failed to wait for process: {}", e))?;

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
                if line.ends_with(".html") && (line.contains("output") || line.contains("Output")) {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if let Some(path) = parts.last() {
                        html_path = Some(path.to_string());
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
async fn read_json_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
async fn validate_input_file(path: String) -> Result<bool, String> {
    let path = PathBuf::from(&path);

    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match extension.as_str() {
        "json" | "xlsx" => Ok(true),
        _ => Err(format!(
            "Invalid file type: .{}. Expected .json or .xlsx",
            extension
        )),
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
            get_palette_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
