# GanttGen

[![Tests](https://github.com/rcobean-sei/GanttGen/actions/workflows/test.yml/badge.svg)](https://github.com/rcobean-sei/GanttGen/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/rcobean-sei/GanttGen/branch/main/graph/badge.svg)](https://codecov.io/gh/rcobean-sei/GanttGen)

A data-driven Gantt chart generator with brand color palettes, configurable tasks, milestones, and pause periods. Generates presentation-ready HTML and PNG outputs.

## Features

- 🎨 **Brand Color Palettes** - Multiple preset palettes (reds, purples, alternating) with accent options
- 📊 **Data-Driven** - Configure via JSON or Excel templates
- 🎯 **Milestones** - Automatic connector lines with smart positioning
- ⏸️ **Pause Periods** - Visual breaks with diagonal stripe pattern
- 📸 **PNG Export** - High-resolution transparent background for presentations
- 📐 **Presentation Ready** - Optimized for 16:9 aspect ratio (1920×1080)

---

## Example Output

![Alternating B Palette Example](palette_examples/template_alternating_b.png)

*Example Gantt chart using the `alternating_b` palette - see [Palette Examples](palette_examples/PALETTE_EXAMPLES.md) for all variants*

---

## Quick Start

```bash
# Install dependencies
npm install

# Generate chart from template
node scripts/build.js --input templates/gantt_template.json --palette alternating

# Generate with specific palette
node scripts/build.js --input input/myproject.json --palette purples_c
```

> 📘 **New to Excel templates?** See the [**Excel Template Guide**](docs/EXCEL_TEMPLATE_GUIDE.md) for step-by-step instructions on using the Excel template.

---

## Project Structure

```
GanttGen/
├── templates/
│   ├── gantt_template.html    # HTML/CSS/JS rendering template
│   ├── gantt_template.json    # JSON data template (copy to input/)
│   └── gantt_template.xlsx    # Excel data template (copy to input/)
├── scripts/
│   ├── build.js               # Main build script
│   ├── json_to_excel.js       # Convert JSON → Excel
│   ├── render.js              # Legacy render script
│   └── generate_template.js   # Excel template generator
├── input/                     # Your project files (gitignored)
├── output/                    # Generated charts (gitignored)
├── config/                    # Build artifacts (gitignored)
└── package.json
```

---

## Usage

### CLI Options

```bash
node scripts/build.js --input <file> [options]

Options:
  --input, -i     Input file (JSON or XLSX) [required]
  --output, -o    Output HTML file (defaults to output/<name>_gantt_chart.html)
  --palette, -p   Color palette preset (see below)
```

### Input Formats

**Option A: JSON** (Recommended for version control)
```bash
node scripts/build.js -i input/project.json -p alternating
```

**Option B: Excel** (Recommended for non-technical users)
```bash
node scripts/build.js -i input/project.xlsx -p reds_b
```

> 📖 **See [Excel Template Guide](docs/EXCEL_TEMPLATE_GUIDE.md)** for detailed instructions on using the Excel template, including sheet-by-sheet documentation and examples.

### Output

Each build generates:
- `output/<name>_gantt_chart_<palette>.html` - Interactive HTML preview
- `output/<name>_gantt_chart_<palette>.png` - High-res PNG (transparent background)

---

## Color Palettes

> 📸 **See [Palette Examples](palette_examples/PALETTE_EXAMPLES.md) for visual comparisons of all palette variants**

### Brand Colors

| Category | Name | Hex | RGB |
|----------|------|-----|-----|
| **Reds** | RED 1 | `#F01840` | 240/24/64 |
| | RED 2 | `#C01830` | 192/24/48 |
| | RED 3 | `#901226` | 144/18/38 |
| | RED 4 | `#600C1C` | 96/12/28 |
| | RED 5 | `#300810` | 48/8/16 |
| **Purples** | PURPLE 1 | `#D0C8C8` | 208/200/200 |
| | PURPLE 2 | `#A0949E` | 160/148/158 |
| | PURPLE 3 | `#705E74` | 112/94/116 |
| | PURPLE 4 | `#402848` | 64/40/72 |
| | PURPLE 5 | `#2A1C30` | 42/28/48 |
| **Neutrals** | CREAM | `#FFFFF8` | 255/255/248 |
| | BLACK | `#141018` | 20/16/24 |

### Palette Presets

| Preset | Task Colors | Accent | Description |
|--------|-------------|--------|-------------|
| `reds` | RED 1 → RED 5 | — | Warm red gradient |
| `reds_a` | RED 1 → RED 5 | — | Same as reds |
| `reds_b` | RED 1 → RED 5 | Purple left border | Red bars + purple accent edge |
| `purples_a` | PURPLE 3 → PURPLE 5 | Burgundy task names | Purple bars + red text |
| `purples_b` | PURPLE 3 → PURPLE 5 | Red left border | Purple bars + red accent edge |
| `purples_c` | PURPLE 3 → PURPLE 5 | Both text + border | Purple bars + full red accent |
| `alternating` | RED/PURPLE mix | — | Maximum visual distinction *(default)* |
| `alternating_b` | RED/PURPLE mix | Red left border | Maximum distinction + brand accent |

### Usage Examples

```bash
# Warm, attention-grabbing red gradient
node scripts/build.js -i input/project.json -p reds

# Sophisticated purple with burgundy task headers
node scripts/build.js -i input/project.json -p purples_a

# Purple bars with red left border accent
node scripts/build.js -i input/project.json -p purples_b

# Purple bars with both burgundy text AND red border
node scripts/build.js -i input/project.json -p purples_c

# Red bars with purple left border accent
node scripts/build.js -i input/project.json -p reds_b

# Alternating red/purple for best task differentiation (default)
node scripts/build.js -i input/project.json -p alternating

# Alternating red/purple with red left border accent
node scripts/build.js -i input/project.json -p alternating_b
```

---

## Configuration Schema

### JSON Structure

```json
{
  "title": "PROJECT TIMELINE",
  "timelineStart": "2025-01-01",
  "timelineEnd": "2025-03-31",
  "showMilestones": true,
  "palette": [
    "#F01840", "#402848", "#C01830",
    "#705E74", "#901226", "#2A1C30"
  ],
  "tasks": [...],
  "milestones": [...],
  "pausePeriods": [...]
}
```

### Tasks

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Task display name |
| `start` | string | ✅ | Start date (YYYY-MM-DD) |
| `end` | string | ✅ | End date (YYYY-MM-DD) |
| `hours` | number | | Estimated hours |
| `subtasks` | array | | Array of subtask descriptions |
| `colorIndex` | number | | Index into palette array |
| `color` | string | | Direct hex color (overrides colorIndex) |

```json
{
  "name": "Phase 1: Discovery",
  "start": "2025-01-06",
  "end": "2025-01-24",
  "hours": 40,
  "subtasks": [
    "Stakeholder interviews",
    "Requirements gathering"
  ],
  "colorIndex": 0
}
```

### Milestones

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Milestone label (use `\n` for line breaks) |
| `date` | string | ✅ | Milestone date (YYYY-MM-DD) |
| `taskIndex` | number | | Index of associated task (for connector color) |

```json
{
  "name": "Project Kickoff",
  "date": "2025-01-06",
  "taskIndex": 0
}
```

### Pause Periods

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `start` | string | ✅ | Pause start date (YYYY-MM-DD) |
| `end` | string | ✅ | Pause end date (YYYY-MM-DD) |

```json
{
  "start": "2025-12-23",
  "end": "2026-01-04"
}
```

Tasks spanning pause periods automatically show a diagonal stripe break effect.

---

## Excel Template

The Excel template (`templates/gantt_template.xlsx`) contains sheets:

| Sheet | Purpose |
|-------|---------|
| **Palette** | Color definitions (hex codes) |
| **Project** | Title, timeline dates, settings |
| **Tasks** | Task definitions with subtasks |
| **Milestones** | Milestone definitions with task linking |
| **PausePeriods** | Break periods |

### Workflow

1. Copy template to `input/` folder
2. Fill in your project data
3. Run build with palette override:
   ```bash
   node scripts/build.js -i input/myproject.xlsx -p alternating
   ```

### Convert JSON ↔ Excel

```bash
# JSON to Excel
node scripts/json_to_excel.js -i input/project.json -o input/project.xlsx

# Excel to JSON (happens automatically during build)
```

---

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build from `config/project.json` |
| `npm run template` | Generate Excel template |
| `npm run render` | Legacy render script |

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `exceljs` | Excel file parsing/generation |
| `puppeteer` | PNG export (optional, uses system Chrome) |

```bash
# Install all dependencies
npm install

# Puppeteer is optional - PNG export uses system Chrome/Edge if available
```

---

## Examples

### Generate All Palette Variants

```bash
for p in reds reds_b purples_a purples_b purples_c alternating; do
  node scripts/build.js -i input/project.json -p $p
done
```

### Custom Output Location

```bash
node scripts/build.js \
  --input input/client_project.json \
  --output presentations/q1_timeline.html \
  --palette purples_c
```

---

## Tips

1. **For presentations**: Use PNG output with transparent background
2. **For differentiation**: Use `alternating` palette (red/purple mix)
3. **For sophistication**: Use `purples_c` with both accent styles
4. **For urgency/energy**: Use `reds` or `reds_b` palette
5. **Pause periods**: Great for holidays, client review periods, etc.

---

## Testing

This project includes a comprehensive test suite using Jest for unit/integration tests and Playwright for E2E and visual regression testing.

### Test Commands

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests with Playwright
npm run test:e2e

# Run visual regression tests only
npm run test:visual

# Run all tests (unit, integration, and E2E)
npm run test:all
```

### Test Structure

- **Unit Tests** (`tests/unit/`) - Fast, isolated tests for individual functions
  - `palette.test.js` - Palette preset functions and color management
  - `parseJSON.test.js` - JSON parsing and validation
  - `parseExcel.test.js` - Excel file parsing
  - `validateConfig.test.js` - Configuration validation
  - `utils.test.js` - Utility functions (color assignment, subtask collection)

- **Integration Tests** (`tests/integration/`) - Test component interactions and workflows
  - `build.test.js` - Full build workflow from input to output
  - `jsonToExcel.test.js` - JSON to Excel conversion
  - `paletteIntegration.test.js` - Palette preset application across the system

- **E2E Tests** (`tests/e2e/`) - Full end-to-end tests with Playwright
  - `build.spec.js` - CLI build command execution
  - `htmlGeneration.spec.js` - HTML output validation and rendering
  - `pngExport.spec.js` - PNG export functionality and cropping

- **Visual Regression Tests** (`tests/visual/`) - Visual consistency tests
  - `regression.spec.js` - Screenshot comparisons for all palette variants

### Coverage Goals

- Unit tests: 80%+ coverage
- Integration tests: Cover all main workflows
- E2E tests: Cover critical user paths
- Visual tests: All palette variants

### Running Specific Tests

```bash
# Run a specific test file
npm test -- palette.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="palette"

# Run E2E tests for a specific file
npm run test:e2e -- build.spec.js

# Run visual tests with UI mode (interactive)
npm run test:visual -- --ui
```

### Debugging Failed Tests

When tests fail, Jest provides detailed error information:

**View Detailed Failure Output**
```bash
# Run tests - failures show detailed error messages in terminal
npm test

# Run with verbose output (shows all test names)
npm test -- --verbose

# Run only failed tests from last run
npm test -- --onlyFailures
```

**Common Failure Information**
- Jest shows the test file and line number where the failure occurred
- Expected vs actual values are displayed
- Stack traces show the call chain
- Error messages explain what went wrong

**Debugging Tips**
```bash
# Run a specific failing test file
npm test -- parseJSON.test.js

# Run a specific test by name
npm test -- --testNamePattern="should parse valid JSON"

# Run in watch mode to see changes immediately
npm run test:watch

# Run with coverage to see which lines weren't tested
npm run test:coverage
```

**Example Failure Output**
When a test fails, you'll see something like:
```
FAIL  tests/unit/parseJSON.test.js
  ✕ should parse valid JSON file (15ms)

  ● should parse valid JSON file

    expect(received).toBe(expected) // Object.is equality

    Expected: "Test Project Timeline"
    Received: undefined

      15 |         const config = parseJSON(tempPath);
      16 |         expect(config.title).toBe('Test Project Timeline');
      17 |                                    ^
```

The output shows:
- Which test failed (`should parse valid JSON file`)
- What was expected vs what was received
- The file and line number where the assertion failed

**Quick Commands to Investigate Failures**
```bash
# See all failures with details
npm test

# Run only the failing tests from last run
npm test -- --onlyFailures

# Run a specific failing test file
npm test -- validateConfig.test.js

# Run with verbose output to see all test names
npm test -- --verbose

# Run a specific test by name pattern
npm test -- --testNamePattern="should pass validation"
```

### Reviewing Test Results

#### Jest Test Reports

After running Jest tests, you can review results in several ways:

**Terminal Output**
- Test results are displayed directly in the terminal
- Coverage summary shows percentage coverage for each file

**HTML Coverage Report**
```bash
# Generate coverage report
npm run test:coverage

# Open the HTML report in your browser
open coverage/index.html
# Or on Windows: start coverage/index.html
# Or on Linux: xdg-open coverage/index.html
```

The HTML coverage report shows:
- Line-by-line coverage for each file
- Coverage percentages by file, function, and branch
- Uncovered lines highlighted in red
- Interactive file browser

**Coverage Files**
- `coverage/lcov.info` - LCOV format (for CI/CD tools)
- `coverage/coverage-final.json` - JSON format (for programmatic access)

#### Playwright Test Reports

Playwright generates separate HTML reports depending on which tests you run:

**E2E Test Report** (default)
```bash
# Run E2E tests (generates report automatically)
npm run test:e2e

# Open the E2E test report
npx playwright show-report
```

The E2E test report shows:
- Test execution timeline
- Pass/fail status for each test
- Screenshots on failure
- Video recordings (if enabled)
- Console logs and network requests
- Trace viewer for debugging failed tests

**Visual Test Report** (separate)
```bash
# Run visual tests (generates its own report)
npm run test:visual

# Open the visual test report
npx playwright show-report
```

**Note**: Each test run (`test:e2e` vs `test:visual`) generates its own report. The `npx playwright show-report` command opens the most recently generated report.

**Report Location**
- Reports are saved to `playwright-report/` directory
- Each run overwrites the previous report (unless configured otherwise)
- To keep multiple reports, use `--reporter=html:report-{timestamp}`

**Running All Playwright Tests Together**
To generate a combined report with both E2E and visual tests:
```bash
# Run all Playwright tests (E2E + visual)
npx playwright test tests/

# Then view the combined report
npx playwright show-report
```

**Viewing Traces**
If a test fails and traces are captured:
```bash
# Open the last test report
npx playwright show-report

# Or view a specific trace file
npx playwright show-trace trace.zip
```

#### Visual Regression Test Results

Visual regression tests generate screenshots for comparison:

```bash
# Run visual tests (generates separate Playwright report)
npm run test:visual

# Screenshots are saved to:
# - test-results/ (actual screenshots)
# - tests/visual/__snapshots__/ (expected baselines)
```

**Reviewing Visual Differences**
1. Run `npx playwright show-report` after `npm run test:visual` to see the visual test report
2. Failed visual tests show side-by-side comparisons in the HTML report
3. Update baselines if changes are intentional:
   ```bash
   npm run test:visual -- --update-snapshots
   ```

#### Continuous Integration

For CI/CD pipelines:
- Jest coverage: Use `coverage/lcov.info` for coverage badges and reports
- Playwright: Reports can be uploaded as artifacts
- Both tools support JUnit XML format (can be configured)

### Test Badges

Test badges are automatically updated via GitHub Actions. The badges at the top of this README show:
- **Tests**: Current status of all test suites (unit, integration, E2E)
- **Coverage**: Code coverage percentage (requires Codecov integration)

**Setting Up Badges** (if not already configured):

1. **GitHub Actions Badge**: Automatically works once the workflow runs
   - Badge URL: `https://github.com/USERNAME/REPO/actions/workflows/test.yml/badge.svg`
   - Replace `USERNAME/REPO` with your repository path

2. **Codecov Badge** (optional):
   - Sign up at [codecov.io](https://codecov.io) and connect your repository
   - The badge will automatically update with coverage data
   - Badge URL: `https://codecov.io/gh/USERNAME/REPO/branch/main/graph/badge.svg`

3. **Custom Badges**: You can create custom badges using [shields.io](https://shields.io)
   ```markdown
   ![Custom Badge](https://img.shields.io/badge/tests-passing-brightgreen)
   ```

### First-Time Setup

Before running E2E or visual tests, you'll need to install Playwright browsers:

```bash
npx playwright install chromium
```

Or install all browsers:

```bash
npx playwright install
```

**Note**: The build script will automatically use locally installed Chrome/Edge browsers if available, falling back to Playwright's bundled Chromium if not found. This avoids unnecessary browser downloads when system browsers are already installed.

---

## Documentation

- 📘 **[Excel Template Guide](docs/EXCEL_TEMPLATE_GUIDE.md)** - Complete guide to using the Excel template with sheet-by-sheet instructions
- 🎨 **[Palette Examples](palette_examples/PALETTE_EXAMPLES.md)** - Visual comparisons of all color palette variants
- 📋 [CSV/Excel Import Spec](docs/CSV_EXCEL_IMPORT_SPEC.md) - Import specifications

---

## License

**Internal Use Only** - This tool is proprietary and intended for internal team use only. Not for public distribution.
