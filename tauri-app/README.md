# GanttGen Desktop App

A cross-platform desktop application for generating beautiful Gantt charts with SEI brand styling.

## Features

- **Drag & Drop Interface**: Simply drag your JSON or Excel input files
- **Visual Palette Selection**: Choose from 7 different SEI color palettes
- **One-Click Generation**: Generate presentation-ready Gantt charts instantly
- **Multiple Outputs**: Export to HTML (interactive) and PNG (high-resolution)
- **Native Performance**: Built with Tauri for small bundle size and native speed

## Screenshots

The app features a clean, professional interface matching the SEI brand colors:
- Cream background (#FFFFF8)
- Black header (#141018)
- Red/Purple accent colors from the SEI palette

## Building

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Platform-specific dependencies (see below)

### Linux

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev patchelf

# Build
cd tauri-app
npm install
npm run tauri:build
```

### macOS

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Build
cd tauri-app
npm install
npm run tauri:build
```

#### macOS Code Signing

For macOS App Store distribution and enhanced security, the app can be code signed during the CI/CD build process.

**Required Secrets:**

The following GitHub repository secrets must be configured for code signing:

| Secret Name | Description | Example/Format |
|-------------|-------------|----------------|
| `MAC_CERT_P12_BASE64` | Base64-encoded .p12 certificate file | `cat certificate.p12 | base64` |
| `MAC_CERT_PASSWORD` | Password for the .p12 certificate | Your certificate password |
| `APPLE_SIGNING_IDENTITY` | Common name of the signing certificate | `"Developer ID Application: Company Name (TEAM_ID)"` |
| `APPLE_ID` | Apple ID for notarization (optional) | `developer@example.com` |
| `APPLE_PASSWORD` | App-specific password for notarization (optional) | Generate at appleid.apple.com |
| `APPLE_TEAM_ID` | Apple Developer Team ID (optional) | 10-character team ID |

**Setting up the certificate:**

1. Export your Apple Developer certificate as a .p12 file from Keychain Access
2. Convert it to base64:
   ```bash
   # On macOS
   base64 -i certificate.p12 -o certificate.p12.base64
   
   # On Linux (use -w 0 to disable line wrapping)
   base64 -w 0 -i certificate.p12 -o certificate.p12.base64
   ```
3. Add the base64 content to GitHub Secrets as `MAC_CERT_P12_BASE64`
4. Add the certificate password to GitHub Secrets as `MAC_CERT_PASSWORD`
5. Add your signing identity to GitHub Secrets as `APPLE_SIGNING_IDENTITY`

**Notarization (Optional):**

For full App Store compliance and to avoid Gatekeeper warnings, you can enable notarization by adding:

- `APPLE_ID`: Your Apple Developer email
- `APPLE_PASSWORD`: An app-specific password (create at https://appleid.apple.com)
- `APPLE_TEAM_ID`: Your 10-character Apple Developer Team ID

**How it works:**

The CI/CD workflow automatically:
1. Creates a temporary keychain on the macOS runner
2. Imports the signing certificate into the keychain
3. Configures the build environment to use the certificate
4. Signs the app bundle during the build process
5. Optionally notarizes the app with Apple (if credentials are provided)
6. Cleans up the temporary keychain after the build

**Local Development:**

Code signing is only enabled in CI/CD. Local builds remain unsigned for faster development iteration. To test signing locally:

```bash
# Set environment variables
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"

# Build
npm run tauri:build
```

### Windows

```bash
# Ensure Visual Studio Build Tools are installed with C++ support

# Build
cd tauri-app
npm install
npm run tauri:build
```

## Development

```bash
cd tauri-app
npm install
npm run tauri:dev
```

## Architecture

```
tauri-app/
├── src/                    # Frontend (HTML/CSS/JS)
│   ├── index.html         # Main UI
│   ├── styles.css         # SEI-styled CSS
│   └── app.js             # Frontend logic
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── lib.rs        # Tauri commands
│   │   └── main.rs       # Entry point
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
└── package.json          # Node dependencies
```

## Color Palettes

The app includes all 7 SEI palette presets:

| Palette | Description |
|---------|-------------|
| `alternating` | Default - Red/purple alternating for best task differentiation |
| `alternating_b` | Alternating with red left border accent |
| `reds` | Warm red gradient |
| `reds_b` | Red gradient with purple left border |
| `purples_a` | Purple gradient with burgundy task names |
| `purples_b` | Purple gradient with red left border |
| `purples_c` | Purple with both burgundy text and red border |

## CI/CD

The app is built automatically via GitHub Actions for:
- Windows (x64)
- macOS (x64 and ARM64) - **with code signing support**
- Linux (x64)

Installers are created for each platform:
- Windows: `.msi` and `.exe` (NSIS)
- macOS: `.dmg` and `.app` (signed and optionally notarized)
- Linux: `.deb`, `.rpm`, and `.AppImage`

### Code Signing

macOS builds can be automatically code signed during CI/CD builds. See the [Apple Code Signing Documentation](../docs/APPLE_CODE_SIGNING.md) for:
- Setting up signing certificates
- Configuring GitHub Secrets
- Enabling notarization
- Troubleshooting common issues

**Quick Setup:**
1. Export your Apple Developer certificate as .p12
2. Add `MAC_CERT_P12_BASE64` and `MAC_CERT_PASSWORD` secrets to GitHub
3. Add `APPLE_SIGNING_IDENTITY` secret
4. (Optional) Add `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID` for notarization

Builds will automatically be signed when these secrets are present.

## License

UNLICENSED - Private/Internal Use Only
