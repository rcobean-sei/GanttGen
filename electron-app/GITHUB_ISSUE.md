# GitHub Issue: Electron Desktop App with SEI-Styled Interface

## Title
Create Electron desktop app with SEI-branded interface and cross-platform installers

## Description

Create a self-contained Electron desktop application for GanttGen that provides users with a straightforward, dependency-included installer-powered solution. The app should feature a clean, appealing interface that matches the SEI brand visual identity guidelines.

## Requirements

### User Interface
- [x] Clean, modern interface matching SEI brand colors and style
- [x] Color palette from SEI Visual Identity (reds, purples, cream, black)
- [x] Step-by-step workflow (1. Input → 2. Palette → 3. Options → Generate)
- [x] Drag-and-drop file input
- [x] Visual palette selector with color previews
- [x] Progress feedback during generation
- [x] Success/error states with actionable next steps

### Functionality
- [x] Support JSON and Excel input files
- [x] 7 SEI-branded color palettes
- [x] HTML export (interactive charts)
- [x] PNG export (high-resolution 1920x1080)
- [x] Custom output directory selection
- [x] File validation and error handling
- [x] Integration with existing build scripts

### Distribution
- [x] Self-contained macOS installer (DMG)
- [x] Self-contained Windows installer (NSIS)
- [x] Universal macOS binary (Intel + Apple Silicon)
- [x] Windows portable executable option
- [x] All dependencies included (no Node.js installation required)

### Technical
- [x] Electron main process with secure IPC
- [x] Preload script for context isolation
- [x] Content Security Policy
- [x] electron-builder configuration
- [x] GitHub Actions workflow for automated builds
- [x] Cross-platform compatibility

## Implementation Details

### File Structure
```
electron-app/
├── src/
│   ├── main.js         # Electron main process
│   ├── preload.js      # Secure IPC bridge
│   ├── index.html      # UI layout
│   ├── app.js          # Frontend logic
│   └── styles.css      # SEI brand styling
├── build/              # Build assets (icons, entitlements)
├── package.json        # Dependencies and build config
├── README.md           # User documentation
├── BUILDING.md         # Developer build guide
└── RELEASE_NOTES.md    # Release notes
```

### Build Configuration
- **electron-builder** for packaging
- **Platform targets:**
  - macOS: DMG + ZIP (x64 + arm64 universal)
  - Windows: NSIS installer + portable EXE (x64)
- **Resource bundling:** Scripts and templates included in app

### GitHub Actions Workflow
- Automated builds on push to feature branches
- Artifact uploads for testing
- Draft release creation on version tags

## SEI Brand Colors Used

Based on SEI Visual Identity guidelines (page 44):

- **RED 1**: #F01840 (Primary action color)
- **RED 2**: #C01830
- **RED 3**: #901226
- **RED 4**: #600C1C
- **RED 5**: #300810
- **PURPLE 1**: #D0C8C8
- **PURPLE 2**: #A0949E
- **PURPLE 3**: #705E74
- **PURPLE 4**: #402848
- **PURPLE 5**: #2A1C30
- **CREAM**: #FFFFF8 (Background)
- **BLACK**: #141018 (Text)

## Testing

### Manual Testing Checklist
- [ ] macOS Intel installation and functionality
- [ ] macOS Apple Silicon installation and functionality
- [ ] Windows 10 installation and functionality
- [ ] Windows 11 installation and functionality
- [ ] JSON file input and processing
- [ ] Excel file input and processing
- [ ] All 7 color palette outputs
- [ ] HTML export quality
- [ ] PNG export quality and resolution
- [ ] Error handling (invalid files)
- [ ] Output directory selection
- [ ] File paths with spaces and special characters

### Automated Testing
- GitHub Actions builds pass
- No console errors in renderer process
- IPC communication works correctly
- File dialogs open and return paths
- Progress events update UI

## Release Process

1. Tag commit with version (e.g., `v0.5.0-testing`)
2. Push tag to GitHub
3. GitHub Actions builds Mac and Windows binaries
4. Download artifacts from workflow
5. Create GitHub release with binaries
6. Add release notes and installation instructions
7. Test downloads from release page

## Documentation

- [x] README.md - User-facing documentation
- [x] BUILDING.md - Developer build guide
- [x] RELEASE_NOTES.md - Version changelog
- [x] Inline code comments
- [x] GitHub issue template (this document)

## Success Criteria

- ✅ App installs on macOS (Intel and Apple Silicon) without errors
- ✅ App installs on Windows 10/11 without errors
- ✅ UI matches SEI brand visual identity
- ✅ All 7 color palettes generate correct output
- ✅ HTML and PNG exports work correctly
- ✅ No Node.js installation required by end users
- ✅ Binaries under 200MB per platform
- ✅ App launches in under 5 seconds

## Branch

`claude/electron-installer-app-0188XCGqJJ2ob6oDXRmRgnQD`

## Labels

- `enhancement`
- `desktop-app`
- `electron`
- `ui-ux`

## Milestone

v0.5.0-testing

---

**Status:** ✅ Complete - Ready for testing and release

**Next Steps:**
1. Commit code to feature branch
2. Push to GitHub
3. Trigger GitHub Actions build
4. Create v0.5.0-testing release
5. Solicit user feedback
