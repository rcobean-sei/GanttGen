# Excel Template Guide

This guide explains how to use the Excel template (`gantt_template.xlsx`) to create Gantt charts. The template contains 5 sheets, each serving a specific purpose.

---

## Quick Start

1. **Copy the template** from `templates/gantt_template.xlsx` to your `input/` folder
2. **Fill in your project data** in each sheet (see details below)
3. **Run the build command:**
   ```bash
   node scripts/build.js --input input/your_project.xlsx --palette alternating_b
   ```

---

## Template Structure

The Excel template contains 5 sheets:

1. **Palette** - Color definitions
2. **Project** - Project settings and timeline
3. **Tasks** - Task definitions with subtasks
4. **Milestones** - Key project milestones
5. **PausePeriods** - Optional break periods

---

## Sheet 1: Palette

**Purpose:** Define the color palette for task bars.

### Structure

| Column | Description |
|--------|-------------|
| `color` | Hex color code (e.g., `#F01840`) |

### How to Use

- **Row 1:** Header row (orange background) - do not modify
- **Row 2+:** One color per row
- Each color cell has a colored background preview
- Colors are referenced by index (0-based) in the Tasks sheet

### Example

```
Row 1: color (header)
Row 2: #F01840 (bright red - index 0)
Row 3: #402848 (dark purple - index 1)
Row 4: #C01830 (darker red - index 2)
...
```

### Tips

- Use brand colors from your style guide
- Colors are applied in order (first task uses index 0, second uses index 1, etc.)
- You can override colors per-task using the `color` column in the Tasks sheet

### How Palette Selection Works

**Two ways to set colors:**

1. **Template Palette (Excel/JSON):** 
   - Used when you build WITHOUT the `--palette` flag
   - Colors come from the Palette sheet in Excel (or `palette` array in JSON)
   - Example: `node scripts/build.js --input input/project.xlsx`

2. **Preset Palette (CLI flag):**
   - Used when you build WITH the `--palette` flag
   - **Overrides** the template palette with a preset (reds, purples, alternating, etc.)
   - Example: `node scripts/build.js --input input/project.xlsx --palette alternating_b`
   - The template palette is ignored in this case

**Current template palette:** The template includes the brand color palette (alternating red/purple) by default. This is used when no `--palette` flag is specified.

---

## Sheet 2: Project

**Purpose:** Define project-level settings and timeline.

### Structure

| Column | Description | Format |
|--------|-------------|--------|
| `title` | Chart title | Text |
| `timelineStart` | Project start date | YYYY-MM-DD |
| `timelineEnd` | Project end date | YYYY-MM-DD |
| `showMilestones` | Show milestones section | TRUE/FALSE |

### How to Use

- **Row 1:** Header row (blue background) - do not modify
- **Row 2:** Data row - enter your project information

### Example

```
Row 1: title | timelineStart | timelineEnd | showMilestones
Row 2: PROJECT TIMELINE | 2025-01-01 | 2025-03-31 | TRUE
```

### Field Details

- **title:** Displayed at the top of the chart (currently hidden in PNG export)
- **timelineStart:** First date shown on the timeline
- **timelineEnd:** Last date shown on the timeline
- **showMilestones:** Set to `TRUE` to show milestones section, `FALSE` to hide

### Tips

- Dates must be in `YYYY-MM-DD` format
- `timelineStart` must be before `timelineEnd`
- All tasks must fall within this date range

---

## Sheet 3: Tasks

**Purpose:** Define all project tasks with their dates, hours, and subtasks.

### Structure

| Column | Description | Format | Required |
|--------|-------------|--------|----------|
| `name` | Task name | Text | ✅ |
| `start` | Task start date | YYYY-MM-DD | ✅ |
| `end` | Task end date | YYYY-MM-DD | ✅ |
| `hours` | Estimated hours | Number | |
| `subtask1` through `subtask10` | Subtask descriptions | Text | |
| `color` | Direct color override | Hex code | |
| `colorIndex` | Palette color index | Number (0-based) | |

### How to Use

- **Row 1:** Header row (green background) - do not modify
- **Row 2+:** One task per row

### Example

```
Row 1: name | start | end | hours | subtask1 | subtask2 | ... | color | colorIndex
Row 2: Phase 1: Discovery | 2025-01-06 | 2025-01-24 | 40 | Stakeholder interviews | Requirements gathering | | | 0
Row 3: Phase 2: Planning | 2025-01-27 | 2025-02-14 | 30 | Define scope | Create plan | | | 1
```

### Field Details

- **name:** Task display name (shown in left column of chart)
- **start/end:** Task date range (must be within Project timeline)
- **hours:** Estimated hours (displayed on task bar)
- **subtask1-10:** Up to 10 subtasks per task (shown as bullet points)
- **color:** Direct hex color (overrides colorIndex if both provided)
- **colorIndex:** Index into Palette sheet (0 = first color, 1 = second, etc.)

### Tips

- **Color assignment:** Use `colorIndex` to reference Palette sheet colors
- **Subtasks:** Leave empty cells if you have fewer than 10 subtasks
- **Date format:** Must be `YYYY-MM-DD` (e.g., `2025-01-15`)
- **Task order:** Tasks appear in the chart in the same order as rows
- **Color left border:** The `colorIndex` also determines the colored left border on the task row

---

## Sheet 4: Milestones

**Purpose:** Define key project milestones with dates and task associations.

### Structure

| Column | Description | Format | Required |
|--------|-------------|--------|----------|
| `name` | Milestone label | Text | ✅ |
| `date` | Milestone date | YYYY-MM-DD | ✅ |
| `linkedTask` | Associated task name | Dropdown | |

### How to Use

- **Row 1:** Header row (purple background) - do not modify
- **Row 2+:** One milestone per row

### Example

```
Row 1: name | date | linkedTask
Row 2: Project Kickoff | 2025-01-06 | Phase 1: Discovery
Row 3: Planning Complete | 2025-02-14 | Phase 2: Planning
```

### Field Details

- **name:** Milestone label (use `\n` for line breaks in the label)
- **date:** Milestone date (must be within Project timeline)
- **linkedTask:** Dropdown menu - select from task names in Tasks sheet

### Tips

- **Linked tasks:** The dropdown automatically populates from the Tasks sheet
- **Connector color:** Milestone connector line color matches the linked task's color
- **Positioning:** Milestones appear at the bottom of the chart with connector lines to tasks
- **Line breaks:** Use `\n` in the name field to create multi-line milestone labels

---

## Sheet 5: PausePeriods

**Purpose:** Define break periods (holidays, client review, etc.) that create visual gaps in tasks.

### Structure

| Column | Description | Format | Required |
|--------|-------------|--------|----------|
| `start` | Pause start date | YYYY-MM-DD | ✅ |
| `end` | Pause end date | YYYY-MM-DD | ✅ |

### How to Use

- **Row 1:** Header row (orange background) - do not modify
- **Row 2+:** One pause period per row
- **Leave empty:** If you have no pause periods, leave rows 2+ empty

### Example

```
Row 1: start | end
Row 2: 2025-12-23 | 2026-01-04
```

### Field Details

- **start:** Pause period start date
- **end:** Pause period end date

### Visual Effect

- Tasks spanning pause periods show a **diagonal stripe break**
- The pause period is overlaid with a diagonal hash pattern
- Task bars are split into segments with a connecting stripe

### Tips

- **Holidays:** Great for marking company holidays or non-working periods
- **Client review:** Use for periods waiting on client feedback
- **Multiple periods:** Add multiple rows for multiple pause periods
- **Date format:** Must be `YYYY-MM-DD`

---

## Building from Excel

Once you've filled in all sheets, build your Gantt chart:

```bash
# Basic build
node scripts/build.js --input input/your_project.xlsx

# With palette preset
node scripts/build.js --input input/your_project.xlsx --palette alternating_b

# Custom output location
node scripts/build.js --input input/your_project.xlsx --output presentations/q1_timeline.html
```

### Output

The build process generates:
- **HTML file:** `output/your_project_gantt_chart_<palette>.html` - Interactive preview
- **PNG file:** `output/your_project_gantt_chart_<palette>.png` - High-res image (auto-cropped)

---

## Common Workflows

### Workflow 1: Start from Template

1. Copy `templates/gantt_template.xlsx` to `input/myproject.xlsx`
2. Fill in Project sheet (title, dates)
3. Add tasks in Tasks sheet
4. Add milestones in Milestones sheet (optional)
5. Add pause periods if needed (optional)
6. Run build command

### Workflow 2: Convert from JSON

If you have a JSON file:

```bash
# Convert JSON to Excel
node scripts/json_to_excel.js --input input/project.json --output input/project.xlsx

# Edit in Excel, then build
node scripts/build.js --input input/project.xlsx --palette alternating_b
```

### Workflow 3: Excel → JSON → Excel

1. Edit Excel template
2. Build from Excel (creates JSON in `config/project.json`)
3. Edit JSON if needed
4. Convert back to Excel for further editing

---

## Tips & Best Practices

### Color Management

- **Use colorIndex:** Prefer `colorIndex` over direct `color` values for consistency
- **Palette presets:** Use `--palette` flag to override with preset palettes
- **Visual distinction:** Ensure adjacent tasks have different colors

### Date Management

- **Consistent format:** Always use `YYYY-MM-DD` format
- **Timeline bounds:** All dates must be within Project timeline
- **Task order:** Tasks appear in row order, not date order

### Subtasks

- **Limit to 10:** Maximum 10 subtasks per task
- **Keep concise:** Subtasks appear as bullet points, keep text short
- **Empty cells:** Leave unused subtask columns empty

### Milestones

- **Link to tasks:** Use dropdown to link milestones to tasks
- **Meaningful names:** Keep milestone names clear and concise
- **Strategic placement:** Place milestones at key decision points

### Pause Periods

- **Plan ahead:** Include known holidays or review periods
- **Visual clarity:** Pause periods help explain task breaks
- **Multiple periods:** Add multiple rows for multiple breaks

---

## Troubleshooting

### Error: "Missing required field: title"

- **Solution:** Fill in the Project sheet, Row 2

### Error: "Task X: start date must be before end date"

- **Solution:** Check that task start date is before end date in Tasks sheet

### Error: "timelineStart must be before timelineEnd"

- **Solution:** Check Project sheet dates

### Colors not showing correctly

- **Solution:** 
  - Verify Palette sheet has colors defined
  - Check that `colorIndex` values in Tasks sheet reference valid palette indices (0-based)
  - Ensure hex codes start with `#`

### Milestones not appearing

- **Solution:**
  - Check `showMilestones` is `TRUE` in Project sheet
  - Verify milestone dates are within timeline
  - Ensure `linkedTask` dropdown has a valid task selected

### Tasks spanning pause periods look broken

- **Solution:** This is intentional! Tasks spanning pause periods show a diagonal stripe break to indicate the pause.

---

## Excel Template Screenshots

The following screenshots show each sheet of the template. Open `templates/gantt_template.xlsx` in Excel to see the actual template.

### Sheet 1: Palette

![Palette Sheet](screenshots/palette_sheet.png)

**What you see:**
- Orange header row with "color" column
- Color rows with hex codes (e.g., `#F01840`)
- Each color cell has a colored background preview
- Colors are referenced by index (0-based) in the Tasks sheet

### Sheet 2: Project

![Project Sheet](screenshots/project_sheet.png)

**What you see:**
- Blue header row: `title | timelineStart | timelineEnd | showMilestones`
- Data row with example project information
- Column widths optimized for readability

### Sheet 3: Tasks

![Tasks Sheet](screenshots/tasks_sheet.png)

**What you see:**
- Green header row with all task columns
- Task rows with colored left borders (matching task colors)
- Columns: name, start, end, hours, subtask1-10, color, colorIndex
- Frozen header row (stays visible when scrolling)

### Sheet 4: Milestones

![Milestones Sheet](screenshots/milestones_sheet.png)

**What you see:**
- Purple header row: `name | date | linkedTask`
- Milestone rows with example data
- `linkedTask` column has dropdown menus (select from Tasks sheet)
- Data validation ensures valid task names

### Sheet 5: PausePeriods

![PausePeriods Sheet](screenshots/pause_periods_sheet.png)

**What you see:**
- Orange header row: `start | end`
- Example pause period row
- Empty rows for additional pause periods

> **Note:** Screenshot images should be placed in `docs/screenshots/` folder. To add screenshots:
> 1. Open `templates/gantt_template.xlsx` in Excel
> 2. Navigate to each sheet
> 3. Take a screenshot (Cmd+Shift+4 on Mac, Snipping Tool on Windows)
> 4. Save as `palette_sheet.png`, `project_sheet.png`, etc. in `docs/screenshots/`

---

## Next Steps

- See [README.md](../README.md) for general usage
- See [Palette Examples](../palette_examples/PALETTE_EXAMPLES.md) for color palette options
- See [CSV_EXCEL_IMPORT_SPEC.md](CSV_EXCEL_IMPORT_SPEC.md) for import specifications

