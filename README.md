# GanttGen

A data-driven Gantt chart generator with configurable tasks, milestones, and pause periods.

## Structure

```
GanttGen/
├── config/
│   └── project.json          # Configuration data (tasks, dates, colors, etc.)
├── templates/
│   ├── gantt_template.html   # HTML template with {{CONFIG}} placeholder
│   ├── gantt_template.xlsx    # Excel template with instructions (generate with npm run template)
│   └── gantt_template.csv     # CSV template (alternative format)
├── scripts/
│   └── render.js             # Build script (reads JSON, generates HTML)
├── output/
│   └── gantt_chart.html      # Generated HTML file (ready to use)
└── package.json              # npm scripts
```

## Usage

### Option A: Excel Template (Recommended)

1. **Generate or use the Excel template:**
   ```bash
   npm run template
   ```
   This creates `templates/gantt_template.xlsx` with:
   - 📋 **INSTRUCTIONS sheet**: Detailed, color-coded instructions
   - 📅 **Project sheet**: Timeline and chart settings
   - ✅ **Tasks sheet**: Task definitions with subtasks
   - 🎯 **Milestones sheet**: Milestone definitions
   - ⏸️ **PausePeriods sheet**: Optional break periods

2. **Fill in the Excel template** following the instructions in the first sheet

3. **Import from Excel:**
   ```bash
   npm run import -- --input templates/gantt_template.xlsx
   ```
   (Import script coming soon - for now, manually copy data to JSON)

4. **Generate HTML:**
   ```bash
   npm run build
   ```

### Option B: Direct JSON Editing

### 1. Edit Configuration

Edit `config/project.json` to customize your chart:

```json
{
  "title": "PROJECT TIMELINE",
  "timelineStart": "2025-12-01",
  "timelineEnd": "2026-02-14",
  "pausePeriods": [...],
  "tasks": [...],
  "milestones": [...]
}
```

### 2. Generate HTML

Run the render script:

```bash
npm run build
# or
node scripts/render.js
```

### 3. Preview

Open `output/gantt_chart.html` in a browser to preview or export as PNG.

## Configuration Schema

### Tasks
- `name`: Task name
- `start`: Start date (YYYY-MM-DD)
- `end`: End date (YYYY-MM-DD)
- `color`: Hex color code
- `hours`: Estimated hours (number)
- `subtasks`: Array of subtask descriptions (optional)

### Milestones
- `name`: Milestone name (use `\n` for line breaks)
- `date`: Milestone date (YYYY-MM-DD)
- `taskIndex`: Index of associated task in tasks array

### Pause Periods
- `start`: Pause start date (YYYY-MM-DD)
- `end`: Pause end date (YYYY-MM-DD)

Tasks that span across pause periods will automatically show a break effect with diagonal stripes.

## Features

- ✅ Data-driven configuration (JSON)
- ✅ Excel template with color-coded instructions
- ✅ Automatic break effects for tasks spanning pause periods
- ✅ Milestone connectors with edge overflow protection
- ✅ Responsive milestone positioning
- ✅ Transparent background for easy export
- ✅ Optimized for PowerPoint presentation (16:9 aspect ratio)

## Commands

- `npm run template` - Generate Excel template with instructions
- `npm run build` - Generate HTML from JSON config
- `npm run import` - Import from Excel/CSV (coming soon)
