# GanttGen 1.0.0 - Initial Release

## Overview

GanttGen 1.0.0 is a simple, data-driven Gantt chart generator that produces presentation-ready HTML and PNG outputs. Just provide your project data in JSON or Excel format, and GanttGen handles the rest - transforming it into clean, professional timeline visualizations with minimal effort.

## Key Features

### Core Functionality
- **Use What You Know**: Works with familiar JSON or Excel (`.xlsx`) files
- **Two Output Options**: Get both interactive HTML and shareable PNG files
- **Ready-to-Use Templates**: Start immediately with included template files
- **Desktop Application**: Optional GUI app if you prefer not to use the command line

### Visualization Features
- **8 Ready-Made Color Schemes**: Just pick one - no design skills needed:
  - `reds`, `reds_a`, `reds_b`
  - `purples_a`, `purples_b`, `purples_c`
  - `alternating`, `alternating_b`
- **Drop Shadow Effects**: One-click option for visual depth
- **Automatic Title Display**: Your project title appears automatically in the chart
- **Task Hierarchy**: Simple nested task support
- **Milestones**: Easy milestone markers
- **Pause Periods**: Visual breaks for project pauses or holidays
- **Optional Hour Tracking**: Add hours if you need them, skip if you don't

### Developer Features
- **Well-Tested**: Full test suite ensures reliability
- **Automated Testing**: GitHub Actions runs tests automatically
- **Template Generator**: Create Excel templates automatically
- **Easy Conversion**: Switch between JSON and Excel formats

## Installation

### CLI Version
```bash
# Clone the repository
git clone https://github.com/rcobean-sei/GanttGen.git
cd GanttGen

# Install dependencies
npm install

# Generate your first chart
node scripts/build.js --input templates/gantt_template.json --palette alternating
```

### Desktop Application
The Tauri desktop application provides a user-friendly interface for creating Gantt charts without command-line interaction.

```bash
# Run the desktop app in development mode
npm run tauri:dev

# Build the desktop app for distribution
npm run tauri:build
```

## Quick Start

### Basic Usage
```bash
# Build from template
node scripts/build.js --input templates/gantt_template.json --palette purples_c

# Build from custom input
node scripts/build.js -i input/myproject.json -p alternating

# Generate Excel template
node scripts/generate_template.js
```

### Running Tests
```bash
# Unit and integration tests
npm test

# E2E tests
npm run test:e2e

# Visual regression tests
npm run test:visual

# All tests with coverage
npm run test:coverage
```

## What's Included

### Templates
- **gantt_template.json**: JSON data template with sample project
- **gantt_template.xlsx**: Excel template for non-technical users
- **gantt_template.html**: HTML/CSS/JS rendering template

### Scripts
- **build.js**: Main build pipeline (JSON/Excel → HTML/PNG)
- **render.js**: Legacy rendering script
- **json_to_excel.js**: JSON to Excel conversion
- **generate_template.js**: Excel template generator
- **tauri-build.js**: Desktop app build automation
- **generate-icons.js**: Icon generation utilities

### Documentation
- **CLAUDE.md**: Comprehensive project guide and reference
- **README.md**: Project overview and getting started guide

## Technical Requirements

- **Node.js**: 18.x or 20.x
- **Chromium**: Automatically installed via Playwright for PNG export
- **Rust**: Required for Tauri desktop app builds (desktop only)

## Platform Support

- **CLI**: macOS, Linux, Windows
- **Desktop App**: macOS, Linux, Windows (via Tauri)
- **Browsers**: Modern browsers supporting ES6+ for HTML output

## Known Limitations

- Visual regression test snapshots are platform-specific (macOS vs Linux)
- PNG export requires Playwright's Chromium binaries (automatically installed with dependencies)
- Excel files must follow the template schema for successful parsing

## Breaking Changes

This is the initial 1.0.0 release, so no breaking changes from previous versions.

## Contributors

Built with care by the SEI team.

## License

UNLICENSED - Private project

---

## Getting Help

- **Documentation**: See `CLAUDE.md` for detailed usage instructions
- **Issues**: Report bugs at https://github.com/rcobean-sei/GanttGen/issues
- **Templates**: Start with the included template files in the `templates/` directory

## What's Next

We're excited to see what you build with GanttGen! Future releases will continue to expand capabilities based on user feedback and requirements.
