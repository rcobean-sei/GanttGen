# GanttGen Electron App

A cross-platform desktop application for generating professional Gantt charts from JSON or Excel files.

## Features

- 📊 Generate beautiful Gantt charts from JSON or Excel input
- 🎨 7 SEI-branded color palettes
- 📱 Clean, modern interface matching SEI brand guidelines
- 💾 Export to HTML (interactive) and PNG (high-resolution)
- 🖥️ Native desktop app for Windows and macOS
- 📦 Self-contained with all dependencies included

## Installation

Download the appropriate installer for your platform from the [Releases](https://github.com/rcobean-sei/GanttGen/releases) page:

- **Windows**: `GanttGen-Setup-0.5.0.exe` (installer) or `GanttGen-0.5.0-win.exe` (portable)
- **macOS**: `GanttGen-0.5.0.dmg` (Intel/Apple Silicon universal)

## Development

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Build for your current platform
npm run build

# Build for specific platforms
npm run build:mac
npm run build:win

# Build for all platforms
npm run build:all
```

## Usage

1. **Select Input File**: Click to browse or drag-and-drop a `.json` or `.xlsx` file
2. **Choose Color Palette**: Select from 7 SEI-branded color schemes
3. **Configure Output**: Choose HTML and/or PNG export, select output directory
4. **Generate**: Click "Generate Gantt Chart" and wait for completion
5. **View Results**: Open the output folder or view the HTML directly

## Input Format

### JSON Example

```json
{
  "title": "Project Timeline",
  "timelineStart": "2025-01-01",
  "timelineEnd": "2025-03-31",
  "tasks": [
    {
      "name": "Phase 1",
      "start": "2025-01-06",
      "end": "2025-01-24",
      "hours": 40,
      "colorIndex": 0,
      "subtasks": ["Task 1", "Task 2"]
    }
  ],
  "milestones": [
    {
      "name": "Kickoff",
      "date": "2025-01-06",
      "taskIndex": 0
    }
  ]
}
```

See `../templates/gantt_template.json` for a complete example.

### Excel Format

Use the provided Excel template (`../templates/gantt_template.xlsx`) for a spreadsheet-based workflow.

## Color Palettes

- **Alternating**: Red/purple mix for best task differentiation (default)
- **Alternating + Border**: With red left border accent
- **Reds**: Warm, energetic red gradient
- **Reds + Purple Border**: Red gradient with purple accent
- **Purples + Burgundy Text**: Purple gradient with burgundy task names
- **Purples + Red Border**: Purple gradient with red accent
- **Purples + Both Accents**: Full SEI branding

## Technologies

- **Electron**: Cross-platform desktop framework
- **Node.js**: Backend processing
- **Playwright**: PNG export engine
- **ExcelJS**: Excel file parsing
- **electron-builder**: Multi-platform packaging

## License

MIT
