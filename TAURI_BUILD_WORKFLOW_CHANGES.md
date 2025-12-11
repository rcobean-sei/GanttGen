# Tauri Build Workflow Changes

This document outlines the changes needed to `.github/workflows/tauri-build.yml` that couldn't be applied automatically. These changes add build versioning with datetime and commit ID for non-release builds.

## Changes Required

### 1. Update Checkout Step (around line 41-42)

**Find:**
```yaml
      - name: Checkout repository
        uses: actions/checkout@v4
```

**Replace with:**
```yaml
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Fetch full history for git describe
```

### 2. Add Release Detection Step (after checkout, before cache steps)

**Add this new step after the checkout step:**
```yaml
      - name: Check if release build
        id: check-release
        run: |
          if git describe --tags --exact-match HEAD 2>/dev/null; then
            echo "is_release=true" >> $GITHUB_OUTPUT
            echo "✓ This is a release build (tagged commit)"
          else
            echo "is_release=false" >> $GITHUB_OUTPUT
            echo "ℹ This is a development build"
          fi
          
          # Get commit hash and datetime for build info
          COMMIT=$(git rev-parse --short=7 HEAD)
          DATETIME=$(date +"%Y%m%d_%H%M%S")
          echo "commit=$COMMIT" >> $GITHUB_OUTPUT
          echo "datetime=$DATETIME" >> $GITHUB_OUTPUT
          echo "Build info: $DATETIME_$COMMIT"
```

### 3. Update macOS Build Step (signed) - around line 252-263

**Find:**
```yaml
      - name: Build Tauri app (macOS with signing)
        if: matrix.platform == 'macos-latest' && github.event_name != 'pull_request'
        env:
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
        working-directory: tauri-app
        run: |
          # Configure keychain in the same shell that runs the build
          security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
          security list-keychain -d user -s "$KEYCHAIN_PATH"
          security default-keychain -s "$KEYCHAIN_PATH"
          echo "Keychain configured, starting build..."
          npm run tauri build -- --target aarch64-apple-darwin
```

**Replace with:**
```yaml
      - name: Build Tauri app (macOS with signing)
        if: matrix.platform == 'macos-latest' && github.event_name != 'pull_request'
        env:
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          BUILD_DATETIME: ${{ steps.check-release.outputs.datetime }}
          BUILD_COMMIT: ${{ steps.check-release.outputs.commit }}
          IS_RELEASE: ${{ steps.check-release.outputs.is_release }}
        working-directory: tauri-app
        run: |
          # Configure keychain in the same shell that runs the build
          security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
          security list-keychain -d user -s "$KEYCHAIN_PATH"
          security default-keychain -s "$KEYCHAIN_PATH"
          echo "Keychain configured, starting build..."
          npm run tauri build -- --target aarch64-apple-darwin
```

### 4. Update macOS Build Step (unsigned for PRs) - around line 265-270

**Find:**
```yaml
      - name: Build Tauri app (macOS unsigned for PRs)
        if: matrix.platform == 'macos-latest' && github.event_name == 'pull_request'
        working-directory: tauri-app
        run: |
          echo "Building unsigned app for PR..."
          npm run tauri build -- --target aarch64-apple-darwin
```

**Replace with:**
```yaml
      - name: Build Tauri app (macOS unsigned for PRs)
        if: matrix.platform == 'macos-latest' && github.event_name == 'pull_request'
        env:
          BUILD_DATETIME: ${{ steps.check-release.outputs.datetime }}
          BUILD_COMMIT: ${{ steps.check-release.outputs.commit }}
          IS_RELEASE: ${{ steps.check-release.outputs.is_release }}
        working-directory: tauri-app
        run: |
          echo "Building unsigned app for PR..."
          npm run tauri build -- --target aarch64-apple-darwin
```

### 5. Update Windows Build Step - around line 272-279

**Find:**
```yaml
      - name: Build Tauri app (Windows)
        if: matrix.platform == 'windows-latest'
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          projectPath: tauri-app
          args: ${{ matrix.args }}
```

**Replace with:**
```yaml
      - name: Build Tauri app (Windows)
        if: matrix.platform == 'windows-latest'
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          BUILD_DATETIME: ${{ steps.check-release.outputs.datetime }}
          BUILD_COMMIT: ${{ steps.check-release.outputs.commit }}
          IS_RELEASE: ${{ steps.check-release.outputs.is_release }}
        with:
          projectPath: tauri-app
          args: ${{ matrix.args }}
```

### 6. Add Artifact Renaming Step for macOS (before upload) - around line 412

**Add this new step BEFORE the "Upload macOS DMG" step:**
```yaml
      - name: Rename macOS artifacts (non-release)
        if: matrix.platform == 'macos-latest' && steps.check-release.outputs.is_release == 'false'
        run: |
          cd tauri-app/src-tauri/target/aarch64-apple-darwin/release/bundle/dmg
          for file in *.dmg; do
            if [ -f "$file" ]; then
              # Extract base name and extension
              base="${file%.dmg}"
              newname="${base}_${{ steps.check-release.outputs.datetime }}_${{ steps.check-release.outputs.commit }}.dmg"
              mv "$file" "$newname"
              echo "Renamed: $file -> $newname"
            fi
          done
```

### 7. Add Artifact Renaming Step for Windows (before upload) - around line 421

**Add this new step BEFORE the "Upload Windows installer" step:**
```yaml
      - name: Rename Windows artifacts (non-release)
        if: matrix.platform == 'windows-latest' && steps.check-release.outputs.is_release == 'false'
        shell: pwsh
        run: |
          $datetime = "${{ steps.check-release.outputs.datetime }}"
          $commit = "${{ steps.check-release.outputs.commit }}"
          
          # Rename NSIS installers
          Get-ChildItem -Path "tauri-app/src-tauri/target/release/bundle/nsis/*.exe" | ForEach-Object {
            $base = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
            $ext = $_.Extension
            $newname = "${base}_${datetime}_${commit}${ext}"
            $newpath = Join-Path $_.DirectoryName $newname
            Move-Item $_.FullName $newpath
            Write-Host "Renamed: $($_.Name) -> $newname"
          }
          
          # Rename MSI installers
          Get-ChildItem -Path "tauri-app/src-tauri/target/release/bundle/msi/*.msi" | ForEach-Object {
            $base = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
            $ext = $_.Extension
            $newname = "${base}_${datetime}_${commit}${ext}"
            $newpath = Join-Path $_.DirectoryName $newname
          Move-Item $_.FullName $newpath
          Write-Host "Renamed: $($_.Name) -> $newname"
        }
```

### 8. (New) Package macOS ZIP Bundle

In addition to the DMG, run the new helper script so CI produces a zipped bundle that mirrors the drag-and-drop experience (includes `GanttGen.app`, the `Clear GanttGen Attributes.command` helper, and an `Applications` alias).

Add this step after the macOS build completes (before uploading artifacts):

```yaml
      - name: Package macOS zip bundle
        if: matrix.platform == 'macos-latest'
        run: ./scripts/create_mac_zip_bundle.sh
```

Then upload the output zip alongside the DMG:

```yaml
      - name: Upload macOS zip bundle
        if: matrix.platform == 'macos-latest'
        uses: actions/upload-artifact@v4
        with:
          name: macos-zip
          path: tauri-app/src-tauri/target/aarch64-apple-darwin/release/bundle/zip/*.zip
```

## Summary

These changes will:
1. Detect if the current commit is a tagged release
2. Generate build metadata (datetime and commit hash) at build time
3. Pass build metadata to the Rust build process via environment variables
4. Rename build artifacts to include `_datetime_commitid` suffix for non-release builds
5. Keep original artifact names for release builds (tagged commits)

The build info will be embedded in the app and displayed in the footer for non-release builds.
