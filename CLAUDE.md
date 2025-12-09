# CLAUDE.md - Project Guide for Claude Code

## Project Overview

GanttGen is a data-driven Gantt chart generator that produces presentation-ready HTML and PNG outputs. It supports brand color palettes, configurable tasks, milestones, and pause periods.

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Run all tests (unit + integration)
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (requires Playwright)
npm run test:e2e

# Run visual regression tests
npm run test:visual

# Run all tests (unit, integration, and E2E)
npm run test:all

# Build a chart from template
node scripts/build.js --input templates/gantt_template.json --palette alternating

# Build from custom input
node scripts/build.js -i input/myproject.json -p purples_c
```

## Project Structure

```
GanttGen/
├── scripts/           # Build and utility scripts
│   ├── build.js       # Main build script (JSON/Excel → HTML/PNG)
│   ├── render.js      # Legacy render script
│   ├── json_to_excel.js       # Convert JSON → Excel
│   └── generate_template.js   # Excel template generator
├── templates/         # Template files
│   ├── gantt_template.html    # HTML/CSS/JS rendering template
│   ├── gantt_template.json    # JSON data template
│   └── gantt_template.xlsx    # Excel data template
├── tests/
│   ├── unit/          # Jest unit tests
│   ├── integration/   # Jest integration tests
│   ├── e2e/           # Playwright E2E tests
│   ├── visual/        # Playwright visual regression tests
│   ├── fixtures/      # Test data files
│   └── helpers/       # Test utilities
├── input/             # User project files (gitignored)
├── output/            # Generated charts (gitignored)
├── config/            # Build artifacts (gitignored)
├── palette_examples/  # Example palette output images
└── tauri-app/         # Tauri desktop app
```

## Key Technologies

- **Node.js** - Runtime (tested on 18.x and 20.x)
- **ExcelJS** - Excel file parsing/generation
- **Puppeteer/Playwright** - PNG export and E2E testing
- **Jest** - Unit and integration testing

## Testing

### Test Commands
- `npm test` - Run unit and integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report (opens `coverage/index.html`)
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:visual` - Run visual regression tests

### First-Time E2E Setup
```bash
npx playwright install chromium
```

### Test Structure
- **Unit tests** (`tests/unit/`): palette.test.js, parseJSON.test.js, parseExcel.test.js, validateConfig.test.js, utils.test.js
- **Integration tests** (`tests/integration/`): build.test.js, jsonToExcel.test.js, paletteIntegration.test.js
- **E2E tests** (`tests/e2e/`): build.spec.js, htmlGeneration.spec.js, pngExport.spec.js
- **Visual tests** (`tests/visual/`): regression.spec.js

## Architecture Notes

### Build Pipeline
1. Input: JSON or Excel file with project data
2. Parse input and validate configuration
3. Apply color palette (preset or custom)
4. Inject data into HTML template
5. Render HTML and export PNG via Puppeteer

### Color Palettes
Available presets: `reds`, `reds_a`, `reds_b`, `purples_a`, `purples_b`, `purples_c`, `alternating`, `alternating_b`

### Data Schema
- **Tasks**: name, start, end, hours (optional), subtasks (optional), colorIndex/color
- **Milestones**: name, date, taskIndex (optional)
- **Pause Periods**: start, end (creates diagonal stripe break effect)

## CI/CD

GitHub Actions workflow (`.github/workflows/test.yml`):
- Runs on Node.js 18.x and 20.x
- Unit/integration tests + E2E tests
- Coverage reports uploaded to Codecov
- Visual regression tests with snapshot artifacts

## Common Development Tasks

### Adding a new palette
1. Edit palette definitions in `scripts/build.js`
2. Add test cases in `tests/unit/palette.test.js`
3. Generate example: `node scripts/build.js -i templates/gantt_template.json -p new_palette`
4. Update visual snapshots if needed: `npm run test:visual -- --update-snapshots`

### Modifying the HTML template
1. Edit `templates/gantt_template.html`
2. Run E2E tests: `npm run test:e2e`
3. Update visual snapshots: `npm run test:visual -- --update-snapshots`

## Important Notes

- PNG export requires a locally installed Chrome/Edge browser (Chromium is no longer bundled). If none is installed, PNG export fails with an explicit error.
- Visual regression snapshots are platform-specific (macOS vs Linux)
- The `input/` and `output/` directories are gitignored for user data
