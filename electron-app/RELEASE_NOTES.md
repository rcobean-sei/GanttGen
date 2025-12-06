# GanttGen Electron App - Release Notes

## v0.5.0-testing (Initial Release)

**Release Date:** December 2025

### Overview

First testing release of the GanttGen Electron desktop application. This provides a native desktop experience for generating professional Gantt charts from JSON or Excel files.

### Features

#### Core Functionality
- ✅ **File Input**: Browse or drag-and-drop JSON/Excel files
- ✅ **7 Color Palettes**: SEI-branded color schemes
  - Alternating (Default) - Best task differentiation
  - Alternating + Border - With red accent
  - Reds - Warm, energetic gradient
  - Reds + Purple Border - Red with purple accent
  - Purples + Burgundy Text - Sophisticated purple tones
  - Purples + Red Border - Purple with red accent
  - Purples + Both Accents - Full branding
- ✅ **Dual Export**: Generate HTML (interactive) and PNG (high-res 1920x1080)
- ✅ **Output Control**: Choose output directory, format options

#### User Interface
- ✅ **SEI Brand Styling**: Matches SEI visual identity guidelines
- ✅ **Clean, Modern Design**: Step-by-step workflow
- ✅ **Visual Palette Selector**: Preview colors before generating
- ✅ **Progress Feedback**: Real-time generation progress
- ✅ **Result Actions**: Quick access to output files and folders

#### Technical
- ✅ **Cross-Platform**: Native apps for macOS and Windows
- ✅ **Self-Contained**: All dependencies included (no Node.js required)
- ✅ **Secure**: Sandboxed renderer process with IPC communication
- ✅ **Lightweight**: ~150MB installed size

### Platform Support

#### macOS
- ✅ **Universal Binary**: Supports both Intel and Apple Silicon (M1/M2/M3)
- ✅ **Minimum Version**: macOS 10.15 (Catalina) or later
- ✅ **Distribution**: DMG installer and ZIP archive
- ⚠️ **Code Signing**: Not signed (users will need to allow in Security & Privacy)

#### Windows
- ✅ **Architecture**: x64 (64-bit)
- ✅ **Minimum Version**: Windows 10 or later
- ✅ **Distribution**: NSIS installer and portable executable
- ⚠️ **SmartScreen**: May trigger warning (not signed)

### Installation

#### macOS
1. Download `GanttGen-0.5.0.dmg`
2. Open the DMG
3. Drag GanttGen to Applications folder
4. Right-click and select "Open" for first launch (unsigned app)

#### Windows
1. Download `GanttGen-Setup-0.5.0.exe` (installer) or `GanttGen-0.5.0-win.exe` (portable)
2. Run the installer or portable executable
3. Click "More info" → "Run anyway" if SmartScreen appears (unsigned app)

### Known Issues

1. **First Launch Warning**: Unsigned apps trigger security warnings
   - **macOS**: Right-click → Open for first launch
   - **Windows**: Click "More info" → "Run anyway"

2. **PNG Export Requires Browser**: Uses Playwright (Chromium) for PNG rendering
   - First PNG export may be slower while downloading browser binaries
   - ~300MB additional disk space for Chromium

3. **File Path Limitations**:
   - Very long file paths (>260 chars on Windows) may cause issues
   - Use shorter paths or move files closer to drive root

4. **Excel Date Parsing**: Excel date formats must be standard
   - Use ISO format (YYYY-MM-DD) or Excel date cells
   - Text dates may not parse correctly

### Testing Checklist

Please test the following scenarios and report any issues:

- [ ] Install on macOS (Intel)
- [ ] Install on macOS (Apple Silicon)
- [ ] Install on Windows 10
- [ ] Install on Windows 11
- [ ] Browse for JSON file
- [ ] Browse for Excel file
- [ ] Select different output directory
- [ ] Generate with each color palette (all 7)
- [ ] Generate HTML only
- [ ] Generate PNG only
- [ ] Generate both HTML and PNG
- [ ] Open output folder
- [ ] View HTML in browser
- [ ] Verify HTML colors match selected palette
- [ ] Verify PNG resolution is 1920x1080
- [ ] Test with minimal JSON file
- [ ] Test with complex JSON file (many tasks)
- [ ] Test with Excel template
- [ ] Verify error handling (invalid file)
- [ ] Verify error handling (corrupted JSON)

### Reporting Issues

If you encounter any problems:

1. Check the [Known Issues](#known-issues) section
2. Review the logs (Help → Show Logs in app, if available)
3. Create a GitHub issue with:
   - Platform and version (e.g., "macOS 14.1 M1")
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Sample input file (if not sensitive)

### What's Next

#### Planned for v0.6.0
- [ ] Code signing for macOS and Windows
- [ ] Auto-update functionality
- [ ] Linux AppImage support
- [ ] Recent files menu
- [ ] Drag-and-drop directly onto app icon
- [ ] Batch processing (multiple files)
- [ ] Preset management (save/load palette preferences)

#### Future Considerations
- [ ] Built-in JSON editor
- [ ] Built-in Excel editor
- [ ] Template gallery
- [ ] Cloud storage integration
- [ ] Collaboration features

### Feedback Welcome!

This is a testing release. Your feedback is crucial for improving GanttGen. Please share:
- Feature requests
- UI/UX suggestions
- Bug reports
- Performance issues
- Platform-specific problems

### Credits

- **Framework**: Electron
- **Build Tool**: electron-builder
- **Rendering**: Playwright (Chromium)
- **Styling**: SEI Brand Guidelines
- **Icons**: Custom SVG icons

---

## Previous Versions

### v0.1.0 - v0.4.0
- Command-line interface (CLI) only
- Tauri desktop app (separate codebase)

---

**Download:** [GitHub Releases](https://github.com/rcobean-sei/GanttGen/releases/tag/v0.5.0-testing)

**Documentation:** [README.md](README.md) | [Building Guide](BUILDING.md)
