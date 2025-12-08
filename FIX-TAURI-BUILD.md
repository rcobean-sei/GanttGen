# Fix tauri-build.yml Build Failures

## Problem
The `tauri-build.yml` workflow in PR 19 fails with:
1. `error: could not find Cargo.toml in /Users/runner/work/GanttGen/GanttGen`
2. `Failed to create app icon: No matching IconType`

## Root Cause
The `actions-rust-lang/setup-rust-toolchain@v1` action has built-in caching enabled by default. This caching looks for `Cargo.toml` in the repository root, but the Tauri project's `Cargo.toml` is located at `tauri-app/src-tauri/Cargo.toml`.

## Fix
Edit `.github/workflows/tauri-build.yml` and add `cache: false` to the Rust setup step.

### Current Code (lines 44-54):
```yaml
      - name: Install Rust stable
        uses: actions-rust-lang/setup-rust-toolchain@v1
        with:
          toolchain: stable
          target: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin' || '' }}

      - name: Cache Rust dependencies
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: 'tauri-app/src-tauri -> target'
          cache-on-failure: true
```

### Fixed Code:
```yaml
      - name: Install Rust stable
        uses: actions-rust-lang/setup-rust-toolchain@v1
        with:
          toolchain: stable
          target: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin' || '' }}
          cache: false

      - name: Cache Rust dependencies
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: 'tauri-app/src-tauri -> target'
          cache-on-failure: true
```

## Steps
1. Open `.github/workflows/tauri-build.yml`
2. Find the "Install Rust stable" step (around line 44)
3. Add `cache: false` under the `with:` block
4. Commit and push the change to the `fix/tauri-feature-parity` branch

This disables the built-in Rust caching (which fails) and allows `Swatinem/rust-cache@v2` (which is correctly configured for the `tauri-app/src-tauri` directory) to handle caching instead.
