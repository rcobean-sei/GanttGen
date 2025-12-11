# GanttGen 1.0.0 - Initial Release

## Overview

GanttGen 1.0.0 is a powerful, data-driven Gantt chart generator that produces presentation-ready HTML and PNG outputs. Built for efficiency and flexibility, GanttGen transforms your project data into professional timeline visualizations with support for custom branding and styling.

## Key Features

### Core Functionality
- **Multiple Input Formats**: Support for both JSON and Excel (`.xlsx`) project files
- **Dual Output Formats**: Generate both interactive HTML and high-quality PNG exports
- **Template System**: Pre-built templates to get started quickly
- **Desktop Application**: Full-featured Tauri-based desktop app for GUI workflow

### Visualization Features
- **Custom Color Palettes**: 8 built-in color schemes including:
  - `reds`, `reds_a`, `reds_b`
  - `purples_a`, `purples_b`, `purples_c`
  - `alternating`, `alternating_b`
- **Drop Shadow Effects**: Optional drop shadows for enhanced visual depth
- **Project Title Display**: Prominent project title rendering in chart headers
- **Task Hierarchy**: Support for tasks with subtasks
- **Milestones**: Visual milestone markers with optional task associations
- **Pause Periods**: Diagonal stripe effects to indicate project pauses or breaks
- **Flexible Time Tracking**: Optional hour tracking per task

### Developer Features
- **Comprehensive Testing**: Full test suite including:
  - Unit tests (Jest)
  - Integration tests (Jest)
  - End-to-end tests (Playwright)
  - Visual regression tests (Playwright)
- **CI/CD Integration**: GitHub Actions workflow with automated testing on Node.js 18.x and 20.x
- **Code Coverage**: Coverage reporting with Codecov integration
- **Template Generation**: Automated Excel template generation
- **Conversion Tools**: JSON to Excel conversion utilities

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
