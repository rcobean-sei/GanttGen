# Building GanttGen Electron App

## Prerequisites

- **Node.js** 18 or later
- **npm** (comes with Node.js)
- **Operating System Requirements**:
  - **macOS**: Required to build `.dmg` and `.app` files for macOS
  - **Windows**: Required to build `.exe` installers for Windows
  - **Linux**: Can build Linux AppImages (not configured in current package.json)

## Local Development

### Install Dependencies

```bash
cd electron-app
npm install
```

Note: If `npm install` fails during the Electron binary download, you can use:

```bash
npm install --ignore-scripts
```

### Run in Development Mode

```bash
npm start
```

This will launch the Electron app in development mode with DevTools enabled.

## Building Distributables

### Build for Your Current Platform

```bash
npm run build
```

This creates distribution packages in the `electron-app/dist/` directory.

### Build for Specific Platforms

**macOS** (must be run on macOS):
```bash
npm run build:mac
```

Creates:
- `GanttGen-0.5.0.dmg` - Installer disk image
- `GanttGen-0.5.0-mac.zip` - Zip archive for manual installation
- Universal binary supporting both Intel and Apple Silicon

**Windows** (must be run on Windows, or Linux with Wine):
```bash
npm run build:win
```

Creates:
- `GanttGen-Setup-0.5.0.exe` - NSIS installer
- `GanttGen-0.5.0-win.exe` - Portable executable (no installation required)

### Build for All Platforms (cross-platform limitations apply)

```bash
npm run build:all
```

Note: Cross-platform building has limitations:
- Building macOS apps on non-macOS systems is not officially supported
- Building Windows apps on Linux requires Wine
- Building Linux apps on Windows/macOS requires Docker

## Automated Builds (GitHub Actions)

The repository includes a GitHub Actions workflow (`.github/workflows/build-electron-app.yml`) that automatically builds the app for both macOS and Windows when:

1. Pushing to branches matching `claude/electron-installer-app-*`
2. Pushing tags matching `v*` (e.g., `v0.5.0`)
3. Manually triggering the workflow

### Creating a Release

To create a new release:

```bash
# Tag the commit
git tag v0.5.0

# Push the tag
git push origin v0.5.0
```

The GitHub Actions workflow will:
1. Build for macOS and Windows
2. Upload artifacts
3. Create a draft GitHub release with the binaries attached

## Build Output Structure

After building, the `dist/` directory contains:

```
dist/
├── mac/
│   ├── GanttGen-0.5.0.dmg          # macOS installer
│   ├── GanttGen-0.5.0-mac.zip      # macOS zip
│   └── GanttGen-0.5.0-mac-arm64.zip # macOS ARM zip
├── win-unpacked/                    # Unpacked Windows app
└── GanttGen-Setup-0.5.0.exe        # Windows installer
└── GanttGen-0.5.0-win.exe          # Windows portable
```

## Code Signing

For production releases, you should sign your applications:

### macOS Signing

1. Obtain an Apple Developer account and certificate
2. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/cert.p12
   export CSC_KEY_PASSWORD=your_password
   export APPLE_ID=your@email.com
   export APPLE_ID_PASSWORD=app-specific-password
   ```
3. Run build: `npm run build:mac`

### Windows Signing

1. Obtain a code signing certificate
2. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/cert.pfx
   export CSC_KEY_PASSWORD=your_password
   ```
3. Run build: `npm run build:win`

## Troubleshooting

### Electron Binary Download Fails

If `npm install` fails due to network issues downloading Electron:

```bash
npm install --ignore-scripts
```

The Electron binary will be downloaded during the build process instead.

### Build Fails on Linux

Building macOS DMG files on Linux is not supported without macOS. Use GitHub Actions or a macOS machine.

Building Windows installers on Linux requires Wine:

```bash
# Install Wine (Ubuntu/Debian)
sudo apt-get install wine64

# Then build
npm run build:win
```

### Permission Errors

If you encounter permission errors during build:

```bash
# Clear electron-builder cache
rm -rf ~/Library/Caches/electron-builder  # macOS
rm -rf ~/.cache/electron-builder          # Linux
```

## Testing the Built App

### macOS

```bash
open dist/mac/GanttGen.app
```

Or install the DMG and run from Applications.

### Windows

```bash
start dist\\GanttGen-Setup-0.5.0.exe  # Install first
# Or run portable
start dist\\GanttGen-0.5.0-win.exe
```

## Next Steps

After building:

1. Test the application thoroughly on the target platform
2. Verify all features work (file selection, palette chooser, generation)
3. Check that the generated Gantt charts are correct
4. Create a GitHub release with the built binaries
5. Update README.md with download links

## Resources

- [electron-builder Documentation](https://www.electron.build/)
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [Code Signing Guide](https://www.electron.build/code-signing)
