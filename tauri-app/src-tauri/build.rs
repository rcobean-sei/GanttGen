use std::env;
use std::fs;
use std::path::Path;
use std::process::Command;

fn main() {
    tauri_build::build();
    
    // Generate build info
    generate_build_info();
}

fn generate_build_info() {
    let out_dir = env::var("OUT_DIR").expect("OUT_DIR not set");
    let dest_path = Path::new(&out_dir).join("build_info.rs");
    
    // Get build datetime
    let datetime = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    
    // Get git commit hash (short, 7 chars)
    let commit = get_git_commit().unwrap_or_else(|| "unknown".to_string());
    
    // Check if this is a release build (tagged commit)
    let is_release = check_is_release();
    
    // Allow environment variable overrides
    let datetime = env::var("BUILD_DATETIME").unwrap_or(datetime);
    let commit = env::var("BUILD_COMMIT").unwrap_or(commit);
    let is_release = env::var("IS_RELEASE")
        .map(|v| v == "true" || v == "1")
        .unwrap_or(is_release);
    
    let build_info = format!(
        r#"// Auto-generated build information
// This file is generated at build time by build.rs

pub const BUILD_DATETIME: &str = "{}";
pub const BUILD_COMMIT: &str = "{}";
pub const IS_RELEASE: bool = {};
"#,
        datetime, commit, is_release
    );
    
    fs::write(&dest_path, build_info).expect("Failed to write build_info.rs");
    
    println!("cargo:rerun-if-changed=.git/HEAD");
    println!("cargo:rerun-if-changed=.git/refs/heads");
    println!("cargo:rerun-if-changed=.git/refs/tags");
}

fn get_git_commit() -> Option<String> {
    // Try to get short commit hash
    let output = Command::new("git")
        .args(&["rev-parse", "--short=7", "HEAD"])
        .output()
        .ok()?;
    
    if output.status.success() {
        let commit = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !commit.is_empty() {
            return Some(commit);
        }
    }
    
    None
}

fn check_is_release() -> bool {
    // Check if current commit is tagged
    let output = Command::new("git")
        .args(&["describe", "--tags", "--exact-match", "HEAD"])
        .output();
    
    if let Ok(output) = output {
        output.status.success()
    } else {
        false
    }
}
