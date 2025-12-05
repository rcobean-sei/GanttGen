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
- macOS (x64 and ARM64)
- Linux (x64)

Installers are created for each platform:
- Windows: `.msi` and `.exe` (NSIS)
- macOS: `.dmg` and `.app`
- Linux: `.deb`, `.rpm`, and `.AppImage`

## License

UNLICENSED - Private/Internal Use Only
