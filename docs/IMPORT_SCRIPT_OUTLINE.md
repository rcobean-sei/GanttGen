# Import Script Implementation Outline

## File Structure

```
GanttGen/
├── scripts/
│   ├── render.js          # Existing: JSON → HTML
│   └── import.js          # New: CSV/Excel → JSON
├── config/
│   └── project.json       # Generated output
├── templates/
│   └── gantt_template.xlsx # Excel template (generated with npm run template)
└── package.json           # Add "import" script
```

## Implementation Plan

### Phase 1: Core CSV Parser

1. **Parse single CSV with sections**
   - Detect section headers (`# PROJECT`, `# TASKS`, etc.)
   - Parse each section into appropriate data structure
   - Handle quoted fields (for subtasks that may contain commas)

2. **Parse multiple CSV files**
   - Read `project.csv`, `tasks.csv`, `milestones.csv`, `pause_periods.csv`
   - Combine into single JSON structure

### Phase 2: Excel Parser

1. **Read Excel workbook**
   - Use `xlsx` package to read `.xlsx` files
   - Parse each sheet (`Project`, `Tasks`, `Milestones`, `PausePeriods`)
   - Handle empty sheets gracefully

### Phase 3: Data Transformation

1. **Convert to JSON structure**
   - Map CSV/Excel columns to JSON properties
   - Collect subtasks from columns `subtask1` through `subtask10` (ignore empty columns)
   - Convert milestone names with `\n` to actual newlines
   - Validate and normalize dates

2. **Auto-calculate fields**
   - Auto-detect `taskIndex` for milestones (match date to task range)
   - Assign default colors if missing (from palette)
   - Validate all required fields

### Phase 4: Validation & Error Handling

1. **Input validation**
   - Check required columns exist
   - Validate date formats (try multiple formats)
   - Validate color codes (with/without `#`)
   - Check numeric fields (hours, taskIndex)

2. **Business logic validation**
   - Timeline start < end
   - Task start < end
   - Dates within timeline range
   - taskIndex within valid range

3. **Error reporting**
   - Clear error messages with row numbers
   - Warnings for non-critical issues
   - Summary report at end

### Phase 5: CLI Interface

1. **Command-line arguments**
   ```bash
   node scripts/import.js --input <file|dir> [--output <path>] [--format <excel|csv>]
   ```

2. **Auto-detection**
   - Detect file format from extension
   - Detect CSV format (single vs multiple files)

3. **Output**
   - Write to `config/project.json` by default
   - Optional `--output` flag for custom path
   - Pretty-print JSON with indentation

## Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "csv-parse": "^5.5.0"
  }
}
```

## Example Usage

```bash
# Install dependencies
npm install

# Import from Excel
npm run import -- --input data/project.xlsx

# Import from Excel
npm run import -- --input templates/gantt_template.xlsx

# Import from CSV directory (multiple files)
npm run import -- --input data/ --format csv

# Custom output path
npm run import -- --input data/project.xlsx --output config/custom.json
```

## Error Handling Examples

```javascript
// Missing required field
Error: Missing required column 'start' in Tasks sheet (row 3)

// Invalid date format
Error: Invalid date format '12/02/2025' in Tasks.start (row 2). Expected YYYY-MM-DD

// Invalid color
Error: Invalid color '#ZZZZZZ' in Tasks.color (row 2). Expected hex color code

// Date out of range
Warning: Task 'Planning & Preparation' end date (2025-12-20) is after timeline end (2025-12-14)

// Auto-fix suggestion
Info: Auto-calculated taskIndex=0 for milestone 'Project Kickoff' (matched to task 'Planning & Preparation')
```

## Code Structure

```javascript
// scripts/import.js

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { parse } = require('csv-parse/sync');

// Main function
function importGanttConfig(inputPath, outputPath) {
  // 1. Detect format
  const format = detectFormat(inputPath);
  
  // 2. Parse input
  const data = format === 'excel' 
    ? parseExcel(inputPath)
    : parseCSV(inputPath);
  
  // 3. Transform to JSON structure
  const json = transformToJSON(data);
  
  // 4. Validate
  const validation = validateJSON(json);
  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }
  
  // 5. Write output
  fs.writeFileSync(outputPath, JSON.stringify(json, null, 2));
  console.log(`✓ Generated ${outputPath}`);
}

// Helper functions
function detectFormat(inputPath) { ... }
function parseExcel(filePath) { ... }
function parseCSV(filePath) { ... }
function transformToJSON(data) { ... }
function validateJSON(json) { ... }
function autoCalculateTaskIndex(milestone, tasks) { ... }
function collectSubtasks(row) {
  // Collect non-empty subtask columns (subtask1 through subtask10)
  const subtasks = [];
  for (let i = 1; i <= 10; i++) {
    const value = row[`subtask${i}`];
    if (value && value.trim()) {
      subtasks.push(value.trim());
    }
  }
  return subtasks;
}

// CLI
if (require.main === module) {
  const args = parseArgs(process.argv);
  importGanttConfig(args.input, args.output || 'config/project.json');
}
```

## Testing Strategy

1. **Unit tests** for each parser function
2. **Integration tests** with sample Excel/CSV files
3. **Validation tests** for error cases
4. **Round-trip test**: JSON → CSV → JSON (preserve data)

## Future Enhancements

- Interactive mode for missing data
- Preview mode (show what would be generated)
- Export existing JSON to CSV/Excel (reverse conversion)
- Google Sheets integration
- Web UI for import

