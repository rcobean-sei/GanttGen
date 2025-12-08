# GanttGen AI Coding Assistant Guide

## Project Overview
GanttGen is a data-driven Gantt chart generator that converts JSON or Excel project data into presentation-ready HTML and PNG outputs. The architecture centers on a single unified build pipeline (`scripts/build.js`) that handles parsing, validation, palette application, and rendering.

## Core Architecture

### Input → Processing → Output Pipeline
```
Input File (JSON/XLSX)
    ↓
Parse (parseJSON / parseExcel)
    ↓
Validate (validateConfig)
    ↓
Apply Palette Preset (if CLI option specified)
    ↓
Generate HTML (inject config into template)
    ↓
Export PNG (Playwright → crop with sharp)
```

### Key Design Principle: Color Resolution Order
Colors are resolved through this precedence:
1. **CLI palette option** (`--palette`) - highest priority, overrides everything
2. **Task-level colorIndex** - index into the config's palette array
3. **Task-level color** - direct hex value fallback
4. **Auto-assign from palette** - modulo assignment to remaining uncolored tasks
5. **Brand default** - BRAND_COLORS (alternating red/purple)

This matters when modifying palette logic or color assignment.

## File Organization

- **`scripts/build.js`** - Single 779-line monolithic build script containing all logic:
  - `PALETTE_PRESETS` constants (8 palettes + BRAND colors)
  - `parseExcel()`, `parseJSON()` - input parsers
  - `validateConfig()` - validation logic
  - `generateHTML()`, `exportPNG()` - output generation
  - `findSystemBrowser()` - Playwright browser detection
- **`templates/gantt_template.html`** - 1142-line template with embedded CSS/JS
- **`templates/gantt_template.json`** - Example JSON format with colorIndex usage
- **`tests/`** - Jest (unit/integration) + Playwright (E2E/visual)

## Critical Workflows

### Running Tests
```bash
npm test                    # Unit + integration (Jest, ~30s timeout)
npm run test:watch         # Development watch mode
npm run test:e2e           # Playwright E2E tests
npm run test:visual        # Visual regression snapshots
npm run test:all           # Everything
npm run test:coverage      # Coverage + opens coverage/index.html
```

**First-time setup:** `npx playwright install chromium`

### Building Charts
```bash
# From template
node scripts/build.js -i templates/gantt_template.json -p alternating

# From custom input
node scripts/build.js -i input/myproject.xlsx -p purples_c

# Outputs: output/<name>_gantt_chart_<palette>.html + .png
```

## Project Conventions & Patterns

### 1. Palette System (8 Presets + Custom)
- Stored in `PALETTE_PRESETS` object (lines 124-207)
- **Palette variants with accents** (`_a`, `_b`, `_c`, `_b` suffixes):
  - `purples_a` - Burgundy task name text accent (RED_3)
  - `purples_b` - Red left border accent (RED_2)
  - `purples_c` - Both text + border accents
  - `reds_b`, `alternating_b` - Left border accents
- **Accent application logic** (lines 730-750): Sets `config.accentColor` and `config.accentBorder` which template CSS uses

### 2. Data Schema Conventions
All inputs normalize to this structure before processing:
```javascript
{
  title: string,
  timelineStart: "YYYY-MM-DD",
  timelineEnd: "YYYY-MM-DD",
  palette: [hex, hex, ...],  // Optional, defaults to BRAND_COLORS
  palettePreset: string,      // Store preset name for template
  accentColor: hex,           // Optional, set by palette variants
  accentBorder: hex,          // Optional, set by palette variants
  tasks: [{
    name: string,
    start: "YYYY-MM-DD",
    end: "YYYY-MM-DD",
    hours: number,
    color: hex,               // Always resolved to direct color
    subtasks: [string, ...]   // Optional, max 10
  }],
  milestones: [{
    name: string,
    date: "YYYY-MM-DD",
    taskIndex: number         // Optional, links to task for connector
  }],
  pausePeriods: [{
    start: "YYYY-MM-DD",
    end: "YYYY-MM-DD"         // Renders diagonal stripe break
  }],
  showMilestones: boolean     // Default true
}
```

### 3. Excel Parsing Order Matters
`parseExcel()` reads sheets in this specific sequence (line 289+):
1. **Palette sheet** - MUST parse first (colors referenced in color index resolution)
2. **Project sheet** - title, timeline dates
3. **Tasks sheet** - task data with up to 10 subtasks (columns F-O)
4. **Milestones sheet** - linked via task name match
5. **PausePeriods sheet** - visual breaks

See `scripts/build.js` lines 289-430 for exact cell mappings.

### 4. Color Index vs Direct Color
```javascript
// JSON/Excel can specify colors two ways:
{ colorIndex: 2 }        // Preferred: index into palette[2]
{ color: "#F01840" }     // Fallback: direct hex value

// During parsing (parseExcel line 404-418):
// - colorIndex takes precedence if both exist
// - Direct color used only if colorIndex unavailable
// - Auto-assigned if neither specified
```

### 5. Browser Detection for PNG Export
`findSystemBrowser()` (lines 24-100) attempts to locate Chrome/Edge before falling back to bundled Playwright Chromium. This is platform-specific (mdfind on macOS, which command on Linux, registry on Windows).

### 6. PNG Export Pipeline
1. Launch Playwright with system browser if available
2. Load HTML via file:// URL
3. Wait for `.milestone-timeline` + milestones DOM elements (lines 687-693)
4. Trigger resize event + wait for debounced handler (lines 697-710)
5. Screenshot with `omitBackground: true` (transparent)
6. Crop to visible pixels using sharp library (optional, silently skips if sharp unavailable)

This is fragile—DOM waits are specific selectors. Changes to template HTML may break PNG export.

## Testing Architecture

### Test Tiers
- **Unit** (`tests/unit/*.test.js`) - Individual functions (palette, parse, validate)
- **Integration** (`tests/integration/*.test.js`) - Full build pipeline with fixtures
- **E2E** (`tests/e2e/*.spec.js`) - Playwright tests of actual HTML output
- **Visual** (`tests/visual/*.spec.js`) - Snapshot-based regression (platform-dependent)

### Mock Data Pattern
Tests import `generateValidProject()`, `generateTask()` from `tests/helpers/mockData.js`. Always use these to ensure test data matches schema expectations.

### Setup Timeout
`jest.setTimeout(30000)` in `tests/helpers/setup.js` (line 6). Integration/E2E tests need this—don't reduce it.

## Common Modifications

### Adding a New Palette
1. Add to `PALETTE_PRESETS` in `scripts/build.js` (lines 124-207)
2. Add test case in `tests/unit/palette.test.js`
3. Add integration test in `tests/integration/paletteIntegration.test.js`
4. For accent variants, update accent logic (lines 730-750)
5. Run visual test: `npm run test:visual -- --update-snapshots`

### Modifying HTML Template
1. Edit `templates/gantt_template.html` (CSS, layout, JavaScript)
2. **Critical:** Preserve `{{CONFIG}}` placeholder (line 680-690 in build.js replaces it)
3. Keep `.milestone-timeline` and `.milestone-label` DOM selectors (PNG export depends on these)
4. Run E2E tests: `npm run test:e2e`
5. Update snapshots: `npm run test:visual -- --update-snapshots`

### Changing Data Schema
1. Update schema in both `parseExcel()` and `parseJSON()`
2. Update test fixtures in `tests/helpers/mockData.js`
3. Add validation in `validateConfig()` (line 446)
4. Update template to use new fields
5. Regenerate examples: `node scripts/build.js -i templates/gantt_template.json -p alternating`

## Known Quirks & Constraints

- **Visual regression snapshots are platform-specific**: Windows/macOS/Linux render differently. CI runs on Linux only.
- **PNG export is slow** (3-5s per chart) due to Playwright waits for DOM rendering.
- **Palette names are case-insensitive** but normalized to lowercase via `getPaletteByName()`.
- **Task subtasks limited to 10** by design (Excel columns F-O hardcoded in parseExcel).
- **Milestone connectors recalculated on resize**—debounced to 50ms. Template JS handles this.
- **Sharp library is optional**—PNG cropping silently skips if not installed.

## Integration Points

### External Dependencies
- **ExcelJS** - Excel workbook parsing (async)
- **Playwright** - Browser automation for PNG export + E2E testing
- **Jest** - Test framework
- **Sharp** - Image optimization (optional, for PNG cropping)

### Cross-Component Communication
The template HTML expects `window.CONFIG` (injected by build.js line 683) containing the full resolved config object. All chart rendering is driven by this object—tasks, milestones, palette, timeline dates.

## Debugging Tips

1. **Chart rendering fails but HTML builds**: Check PNG export logs. Browser not found? Check `findSystemBrowser()` output.
2. **Colors not applying**: Verify palette precedence. CLI option overrides config. Check color resolution order (see Architecture section).
3. **Milestones missing**: Verify `showMilestones: true` in config. Check milestone date is within timeline bounds.
4. **Tests timeout**: Increase jest.setTimeout in setup.js if modifying template rendering.
5. **Visual test snapshots drift**: Rebuild on the CI platform (Linux) to match—platform rendering differs.
