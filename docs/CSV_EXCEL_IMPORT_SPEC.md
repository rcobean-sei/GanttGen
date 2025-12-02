# CSV/Excel Import Specification

## Overview

This specification defines the input format for converting CSV or Excel files into the Gantt chart JSON configuration format. The converter script will read structured data from spreadsheets and generate `config/project.json`.

## Supported Formats

1. **Excel (.xlsx)**: Multi-sheet workbook (recommended)
2. **CSV**: Single file with section headers, or multiple CSV files

## Excel Format (Recommended)

### Sheet Structure

The Excel workbook should contain the following sheets:

1. **`Project`** - Project metadata
2. **`Tasks`** - Task definitions
3. **`Milestones`** - Milestone definitions
4. **`PausePeriods`** - Pause/break periods (optional)

---

### Sheet 1: `Project`

Single-row sheet with project-wide settings.

| Column | Description | Required | Example | Default |
|--------|-------------|----------|---------|---------|
| `title` | Chart title | Yes | "PROJECT TIMELINE" | "PROJECT TIMELINE" |
| `timelineStart` | Start date (YYYY-MM-DD) | Yes | "2025-12-01" | - |
| `timelineEnd` | End date (YYYY-MM-DD) | Yes | "2026-02-14" | - |
| `showMilestones` | Show milestones (true/false) | No | true | true |

**Note:** `highlightEvery` (highlight every 5th day) and `dateFormat` ("short") are hard-coded in the rendering logic and do not need to be specified.

**Example:**
```
title              | timelineStart | timelineEnd | showMilestones
PROJECT TIMELINE   | 2025-12-01    | 2026-02-14  | true
```

---

### Sheet 2: `Tasks`

One row per task. Subtasks are provided in separate columns (up to 10 subtasks per task).

| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| `name` | Task name | Yes | "Planning & Preparation" |
| `start` | Start date (YYYY-MM-DD) | Yes | "2025-12-02" |
| `end` | End date (YYYY-MM-DD) | Yes | "2025-12-14" |
| `color` | Hex color code | Yes | "#E31E26" |
| `hours` | Estimated hours | Yes | 20 |
| `subtask1` | First subtask | No | "Define scope: URLs/Domains to audit; discovery and interviews" |
| `subtask2` | Second subtask | No | "Determine test personas/scenarios" |
| `subtask3` | Third subtask | No | "Baseline environment setup, any special access required" |
| `subtask4` through `subtask10` | Additional subtasks (optional) | No | - |

**Example:**
```
name                                    | start       | end         | color     | hours | subtask1                                                      | subtask2                                    | subtask3
Planning & Preparation                  | 2025-12-02  | 2025-12-14  | #E31E26   | 20    | Define scope: URLs/Domains to audit; discovery and interviews | Determine test personas/scenarios            | Baseline environment setup, any special access required
Initial Site Scans – Tracking System   | 2025-12-15  | 2026-01-11  | #2CABDB   | 20    | Scan site and mobile app                                      | Capture all tracking artifacts              | Log and classify by purpose/category
```

**Note:** 
- Leave subtask columns empty if a task has fewer than 10 subtasks
- Empty subtask columns are ignored (not included in the JSON output)
- Maximum of 10 subtasks per task

---

### Sheet 3: `Milestones`

One row per milestone.

| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| `name` | Milestone name (use `\n` for line breaks) | Yes | "Project\nKickoff" |
| `date` | Milestone date (YYYY-MM-DD) | Yes | "2025-12-02" |
| `taskIndex` | Zero-based index of associated task | Yes | 0 |

**Example:**
```
name              | date       | taskIndex
Project\nKickoff  | 2025-12-02 | 0
Testing\nComplete | 2026-01-25 | 2
Deliver\nFinal Report | 2026-02-09 | 4
```

**Note:** `taskIndex` refers to the row number in the Tasks sheet (0-indexed). The script can optionally auto-detect this by matching milestone date to task date ranges.

---

### Sheet 4: `PausePeriods` (Optional)

One row per pause/break period.

| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| `start` | Pause start date (YYYY-MM-DD) | Yes | "2025-12-23" |
| `end` | Pause end date (YYYY-MM-DD) | Yes | "2026-01-04" |

**Example:**
```
start       | end
2025-12-23  | 2026-01-04
```

If this sheet is empty or missing, no pause periods will be included.

---

## CSV Format (Alternative)

### Option A: Multiple CSV Files

Create separate CSV files:
- `project.csv`
- `tasks.csv`
- `milestones.csv`
- `pause_periods.csv` (optional)

Same column structure as Excel sheets above.

### Option B: Single CSV with Sections

Use section headers to separate data:

```csv
# PROJECT
title,timelineStart,timelineEnd,showMilestones
PROJECT TIMELINE,2025-12-01,2026-02-14,true

# TASKS
name,start,end,color,hours,subtask1,subtask2,subtask3,subtask4,subtask5,subtask6,subtask7,subtask8,subtask9,subtask10
Planning & Preparation,2025-12-02,2025-12-14,#E31E26,20,"Define scope: URLs/Domains to audit; discovery and interviews","Determine test personas/scenarios","Baseline environment setup, any special access required",,,,,
Initial Site Scans – Tracking System,2025-12-15,2026-01-11,#2CABDB,20,"Scan site and mobile app","Capture all tracking artifacts (cookies, storage, third party scripts, beacons/pixels)","Log and classify by purpose/category",,,,,

# MILESTONES
name,date,taskIndex
Project\nKickoff,2025-12-02,0
Testing\nComplete,2026-01-25,2

# PAUSE_PERIODS
start,end
2025-12-23,2026-01-04
```

---

## Script Specification

### Command-Line Interface

```bash
# Excel input
npm run import -- --input data/project.xlsx --output config/project.json

# CSV input (single file)
npm run import -- --input data/project.csv --output config/project.json

# CSV input (multiple files in directory)
npm run import -- --input data/ --output config/project.json

# Auto-detect format
npm run import -- --input data/project.xlsx
```

### Script Behavior

1. **Read Input**: Detect format (Excel vs CSV) and parse accordingly
2. **Validate**: Check required fields, date formats, color codes
3. **Transform**: Convert spreadsheet data to JSON structure
4. **Auto-calculate**: Optionally auto-calculate `taskIndex` for milestones by matching dates
5. **Write Output**: Generate `config/project.json` (or specified output path)
6. **Error Handling**: Report validation errors with row numbers and clear messages

### Validation Rules

- Dates must be in `YYYY-MM-DD` format
- Colors must be valid hex codes (with or without `#`)
- `taskIndex` must be a valid integer (0 or greater)
- `hours` must be a number (0 or greater)
- `timelineStart` must be before `timelineEnd`
- Task `start` must be before task `end`
- Task dates must fall within timeline range
- Milestone dates should fall within timeline range (warning, not error)
- Pause period `start` must be before `end`

### Error Messages

The script should provide clear error messages:
- `Error: Missing required column 'name' in Tasks sheet (row 3)`
- `Error: Invalid date format '12/02/2025' in Tasks.start (row 2). Expected YYYY-MM-DD`
- `Error: Invalid color '#ZZZZZZ' in Tasks.color (row 2). Expected hex color code`
- `Warning: Milestone 'Project Kickoff' date (2025-12-02) is outside timeline range`

---

## Example Files

### Excel Template

A template Excel file (`templates/gantt_template.xlsx`) will be provided with:
- Pre-formatted sheets with headers
- Example data rows
- Data validation (where possible)
- Color picker cells (where supported)

### CSV Format

CSV format is supported for import, but the Excel template is recommended for the best user experience.

---

## Implementation Notes

### Dependencies

- **Excel**: Use `xlsx` npm package (or `exceljs` for better formatting support)
- **CSV**: Use native Node.js `fs` and `csv-parse` package

### Subtask Handling

- Read subtasks from columns `subtask1` through `subtask10`
- Ignore empty subtask columns
- Collect non-empty subtasks into an array for the JSON output

### Auto-detection Features

- **taskIndex**: If `taskIndex` is missing or invalid, attempt to match milestone date to task date ranges
- **Color**: If color is missing, assign from a default palette based on task order
- **Date formats**: Attempt to parse common date formats (MM/DD/YYYY, DD-MM-YYYY, etc.) and convert to YYYY-MM-DD

---

## Future Enhancements

- Support for Google Sheets import
- Interactive CLI for missing data
- Preview mode (generate HTML without writing JSON)
- Validation report generation
- Import from existing JSON (reverse conversion)

