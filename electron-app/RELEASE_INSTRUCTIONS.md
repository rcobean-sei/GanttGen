# Release Instructions for v0.5.0-testing

## Overview

The Electron app code has been committed and pushed to branch `claude/electron-installer-app-0188XCGqJJ2ob6oDXRmRgnQD`.

A GitHub Actions workflow has been configured to automatically build Mac and Windows binaries when a tag is pushed.

## Creating the Release

### Step 1: Create and Push Tag

```bash
# Create annotated tag
git tag -a v0.5.0-testing -m "GanttGen Electron App v0.5.0-testing - First testing release"

# Push tag (triggers GitHub Actions build)
git push origin v0.5.0-testing
```

### Step 2: Monitor GitHub Actions Build

1. Go to: https://github.com/rcobean-sei/GanttGen/actions
2. Find the "Build Electron App" workflow run
3. Wait for both macOS and Windows builds to complete (~10-15 minutes)
4. Download artifacts if needed for testing

### Step 3: Create GitHub Release

Once the GitHub Actions workflow completes:

1. Go to: https://github.com/rcobean-sei/GanttGen/releases
2. Click "Draft a new release"
3. Fill in release details:

**Tag:** `v0.5.0-testing`

**Release title:** `GanttGen Electron App v0.5.0-testing`

**Description:**
```markdown
# GanttGen Electron Desktop App - v0.5.0-testing

First testing release of the cross-platform Electron desktop application for GanttGen.

## 🎨 Features

- **SEI-Branded Interface**: Clean, modern UI matching SEI visual identity guidelines
- **7 Color Palettes**: Choose from SEI-branded color schemes
- **Dual Export**: Generate interactive HTML and high-resolution PNG (1920x1080)
- **User-Friendly**: Step-by-step workflow with drag-and-drop file input
- **Cross-Platform**: Native apps for macOS and Windows
- **Self-Contained**: All dependencies included - no Node.js required

## 📦 Downloads

### macOS
- **GanttGen-0.5.0.dmg** - DMG installer (recommended)
- **GanttGen-0.5.0-mac.zip** - ZIP archive
- Supports both Intel and Apple Silicon (M1/M2/M3)
- Requires macOS 10.15 (Catalina) or later

### Windows
- **GanttGen-Setup-0.5.0.exe** - NSIS installer (recommended)
- **GanttGen-0.5.0-win.exe** - Portable executable (no installation)
- Requires Windows 10 or later (64-bit)

## ⚠️ Installation Notes

### macOS
1. Download and open the DMG
2. Drag GanttGen to Applications folder
3. **First launch:** Right-click → "Open" (app is not signed)
4. Accept the security prompt

### Windows
1. Download and run the installer or portable executable
2. **If SmartScreen appears:** Click "More info" → "Run anyway" (app is not signed)

## 🐛 Known Issues

- **Security Warnings**: Apps are unsigned and will trigger warnings on first launch
- **PNG Export**: First PNG export downloads Chromium (~300MB) - may take a few minutes
- **Long Paths**: Very long file paths (>260 chars on Windows) may cause issues

## 📚 Documentation

- [README](https://github.com/rcobean-sei/GanttGen/blob/claude/electron-installer-app-0188XCGqJJ2ob6oDXRmRgnQD/electron-app/README.md)
- [Building Guide](https://github.com/rcobean-sei/GanttGen/blob/claude/electron-installer-app-0188XCGqJJ2ob6oDXRmRgnQD/electron-app/BUILDING.md)
- [Release Notes](https://github.com/rcobean-sei/GanttGen/blob/claude/electron-installer-app-0188XCGqJJ2ob6oDXRmRgnQD/electron-app/RELEASE_NOTES.md)

## 🧪 Testing

This is a **testing release**. Please help us improve by:

1. Testing on your platform (macOS Intel, macOS Apple Silicon, Windows 10/11)
2. Reporting any bugs or issues
3. Suggesting improvements to the UI/UX
4. Trying different input files and palettes

Report issues: https://github.com/rcobean-sei/GanttGen/issues

## 🚀 What's Next

Planned for v0.6.0:
- Code signing for macOS and Windows
- Auto-update functionality
- Linux support
- Recent files menu
- Batch processing

## 📝 Changelog

See [RELEASE_NOTES.md](https://github.com/rcobean-sei/GanttGen/blob/claude/electron-installer-app-0188XCGqJJ2ob6oDXRmRgnQD/electron-app/RELEASE_NOTES.md) for full details.

---

**Feedback and contributions welcome!**
```

4. **Attach Binaries:**
   - Download artifacts from the GitHub Actions run
   - Or wait for the workflow to automatically attach them if configured
   - Manually upload if needed:
     - `GanttGen-0.5.0.dmg`
     - `GanttGen-0.5.0-mac.zip`
     - `GanttGen-Setup-0.5.0.exe`
     - `GanttGen-0.5.0-win.exe`

5. **Set as Pre-release:** Check "This is a pre-release" (testing version)

6. **Publish:** Click "Publish release"

## Step 4: Announce

After publishing, announce the release:

1. Update main README.md with download links
2. Post in relevant channels/forums
3. Solicit feedback from test users

## Alternative: Manual Build

If GitHub Actions fails or you need to build locally:

### macOS
```bash
cd electron-app
npm ci
npm run build:mac
# Binaries in electron-app/dist/
```

### Windows
```bash
cd electron-app
npm ci
npm run build:win
# Binaries in electron-app/dist/
```

Upload the binaries manually to the GitHub release.

## Rollback

If issues are discovered:

1. Mark release as "Draft" or delete it
2. Fix issues in the codebase
3. Create a new tag (e.g., v0.5.1-testing)
4. Rebuild and re-release

## Support

For issues with the release process, check:
- GitHub Actions logs for build errors
- electron-builder documentation for packaging issues
- Test the app locally before releasing

---

**Status:** Ready for release once tag is pushed with proper permissions

**Branch:** `claude/electron-installer-app-0188XCGqJJ2ob6oDXRmRgnQD`

**Tag:** `v0.5.0-testing` (created locally, needs push with proper permissions)
