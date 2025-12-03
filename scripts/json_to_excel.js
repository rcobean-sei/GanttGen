#!/usr/bin/env node

/**
 * Convert JSON Gantt chart configuration to Excel format
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function jsonToExcel(jsonPath, excelPath) {
    // Read JSON file
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const config = JSON.parse(jsonContent);
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    
    // ============================================================
    // INSTRUCTIONS SHEET
    // ============================================================
    const instructionsSheet = workbook.addWorksheet('Instructions', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });
    
    // Title
    instructionsSheet.getRow(1).values = ['GanttGen Excel Template - Instructions'];
    instructionsSheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    instructionsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
    instructionsSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    instructionsSheet.getRow(1).height = 35;
    instructionsSheet.mergeCells('A1:D1');
    
    // Instructions content
    const instructions = [
        ['', '', '', ''],
        ['QUICK START', '', '', ''],
        ['1. Fill in the Project sheet with your timeline dates', '', '', ''],
        ['2. Add your tasks in the Tasks sheet', '', '', ''],
        ['3. Add milestones in the Milestones sheet (optional)', '', '', ''],
        ['4. Add pause periods if needed (optional)', '', '', ''],
        ['5. Run: node scripts/build.js --input your_file.xlsx --palette alternating_b', '', '', ''],
        ['', '', '', ''],
        ['SHEET GUIDE', '', '', ''],
        ['', '', '', ''],
        ['Sheet Name', 'Purpose', 'Required', 'Notes'],
        ['Palette', 'Color definitions', 'Optional*', '*Palette preset flag overrides this'],
        ['Project', 'Timeline & settings', 'Required', 'Set start/end dates and title'],
        ['Tasks', 'Task definitions', 'Required', 'Add tasks with dates, hours, subtasks'],
        ['Milestones', 'Key milestones', 'Optional', 'Link to tasks via dropdown'],
        ['PausePeriods', 'Break periods', 'Optional', 'Holidays, reviews, etc.'],
        ['', '', '', ''],
        ['COLOR PALETTES', '', '', ''],
        ['', '', '', ''],
        ['Use --palette flag to override template colors:', '', '', ''],
        ['  • reds, reds_b - Red gradients', '', '', ''],
        ['  • purples_a, purples_b, purples_c - Purple gradients', '', '', ''],
        ['  • alternating, alternating_b - Red/purple mix (recommended)', '', '', ''],
        ['', '', '', ''],
        ['DATE FORMAT', '', '', ''],
        ['All dates must be in YYYY-MM-DD format (e.g., 2025-01-15)', '', '', ''],
        ['', '', '', ''],
        ['TIPS', '', '', ''],
        ['• Use colorIndex in Tasks sheet to reference Palette colors (0-based)', '', '', ''],
        ['• Milestones link to tasks via dropdown menu', '', '', ''],
        ['• Tasks spanning pause periods show diagonal stripe breaks', '', '', ''],
        ['• Leave empty cells if you have fewer than 10 subtasks', '', '', ''],
        ['', '', '', ''],
        ['DOCUMENTATION', '', '', ''],
        ['See docs/EXCEL_TEMPLATE_GUIDE.md for detailed instructions', '', '', '']
    ];
    
    instructions.forEach((row, idx) => {
        const excelRow = instructionsSheet.getRow(idx + 2);
        excelRow.values = row;
        
        // Style section headers
        if (row[0] === 'QUICK START' || row[0] === 'SHEET GUIDE' || row[0] === 'COLOR PALETTES' || 
            row[0] === 'DATE FORMAT' || row[0] === 'TIPS' || row[0] === 'DOCUMENTATION') {
            excelRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            excelRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3498DB' } };
            excelRow.height = 25;
            if (row[0] !== 'Sheet Name') {
                instructionsSheet.mergeCells(`A${idx + 2}:D${idx + 2}`);
            }
        }
        // Style table header
        else if (row[0] === 'Sheet Name') {
            excelRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            excelRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27AE60' } };
            excelRow.height = 25;
        }
        // Style regular rows
        else if (row[0] && !row[0].startsWith('•') && !row[0].startsWith('  •') && row[0] !== '') {
            excelRow.font = { size: 11 };
        }
        // Style bullet points
        else if (row[0] && row[0].startsWith('•')) {
            excelRow.font = { size: 10, italic: true };
            excelRow.getCell(1).alignment = { indent: 2 };
        }
    });
    
    // Set column widths
    instructionsSheet.getColumn('A').width = 50;
    instructionsSheet.getColumn('B').width = 30;
    instructionsSheet.getColumn('C').width = 15;
    instructionsSheet.getColumn('D').width = 40;
    
    // ============================================================
    // PALETTE SHEET
    // ============================================================
    const paletteSheet = workbook.addWorksheet('Palette', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });
    
    // Header row
    paletteSheet.getRow(1).values = ['color'];
    paletteSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    paletteSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } };
    paletteSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    paletteSheet.getRow(1).height = 25;
    
    // Add palette colors
    const palette = config.palette || [];
    palette.forEach((color, idx) => {
        const row = paletteSheet.getRow(idx + 2);
        row.values = [color || ''];
        row.font = { color: { argb: 'FF2C3E50' } };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
        
        // Add a colored cell background preview
        if (color) {
            const colorHex = color.substring(1);
            const colorArgb = `FF${colorHex}`;
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorArgb } };
            row.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        }
    });
    
    // Set column width
    paletteSheet.getColumn('A').width = 20;
    
    // ============================================================
    // PROJECT SHEET
    // ============================================================
    const projectSheet = workbook.addWorksheet('Project', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });
    
    // Header row
    projectSheet.getRow(1).values = ['title', 'timelineStart', 'timelineEnd', 'showMilestones'];
    projectSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    projectSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3498DB' } };
    projectSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    projectSheet.getRow(1).height = 25;
    
    // Data row
    projectSheet.getRow(2).values = [
        config.title || 'PROJECT TIMELINE',
        config.timelineStart || '',
        config.timelineEnd || '',
        config.showMilestones !== undefined ? config.showMilestones : true
    ];
    projectSheet.getRow(2).font = { color: { argb: 'FF2C3E50' } };
    projectSheet.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    
    // Set column widths
    projectSheet.getColumn('A').width = 25;
    projectSheet.getColumn('B').width = 18;
    projectSheet.getColumn('C').width = 18;
    projectSheet.getColumn('D').width = 18;
    
    // ============================================================
    // TASKS SHEET
    // ============================================================
    const tasksSheet = workbook.addWorksheet('Tasks', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });
    
    // Header row
    const taskHeaders = ['name', 'start', 'end', 'hours', 
        'subtask1', 'subtask2', 'subtask3', 'subtask4', 'subtask5',
        'subtask6', 'subtask7', 'subtask8', 'subtask9', 'subtask10', 'color', 'colorIndex'];
    tasksSheet.getRow(1).values = taskHeaders;
    tasksSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    tasksSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27AE60' } };
    tasksSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    tasksSheet.getRow(1).height = 30;
    
    // Add task rows
    if (config.tasks && Array.isArray(config.tasks)) {
        config.tasks.forEach((task, idx) => {
            const row = tasksSheet.getRow(idx + 2);
            
            const rowData = [
                task.name || '',
                task.start || '',
                task.end || '',
                task.hours || 0
            ];
            
            // Add subtasks (up to 10)
            const subtasks = task.subtasks || [];
            for (let i = 0; i < 10; i++) {
                rowData.push(subtasks[i] || '');
            }
            
            // Add color (for reference, but prefer colorIndex)
            // If task has colorIndex, use that; otherwise use direct color
            const colorIndex = task.colorIndex !== undefined ? task.colorIndex : '';
            const directColor = task.color || '';
            
            rowData.push(directColor); // color column
            rowData.push(colorIndex); // colorIndex column
            
            row.values = rowData;
            
            // Style the row
            row.font = { color: { argb: 'FF2C3E50' } };
            row.fill = { 
                type: 'pattern', 
                pattern: 'solid', 
                fgColor: { argb: 'FFF8F9FA' }
            };
            row.border = {
                top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
            };
            
            // Add colored left border if color is specified
            // Resolve color from palette if colorIndex is used
            let taskColor = task.color;
            if (task.colorIndex !== undefined && palette && palette.length > 0) {
                const colorIdx = Number(task.colorIndex);
                if (!isNaN(colorIdx) && colorIdx >= 0 && colorIdx < palette.length) {
                    taskColor = palette[colorIdx];
                }
            }
            
            if (taskColor) {
                const colorHex = taskColor.substring(1);
                const colorArgb = `FF${colorHex}`;
                row.border.left = { style: 'medium', color: { argb: colorArgb } };
            }
        });
    }
    
    // Set column widths
    tasksSheet.getColumn('A').width = 35;
    tasksSheet.getColumn('B').width = 15;
    tasksSheet.getColumn('C').width = 15;
    tasksSheet.getColumn('D').width = 10;
    for (let i = 5; i <= 14; i++) {
        tasksSheet.getColumn(i).width = 40;
    }
    tasksSheet.getColumn('O').width = 12; // color column
    tasksSheet.getColumn('P').width = 12; // colorIndex column
    
    // ============================================================
    // MILESTONES SHEET
    // ============================================================
    const milestonesSheet = workbook.addWorksheet('Milestones', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });
    
    // Header row
    milestonesSheet.getRow(1).values = ['name', 'date', 'linkedTask'];
    milestonesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    milestonesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9B59B6' } };
    milestonesSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    milestonesSheet.getRow(1).height = 25;
    
    // Create a named range for task names (for dropdown validation)
    const taskNamesRange = 'Tasks!$A$2:$A$1000';
    
    // Add milestone rows
    if (config.milestones && Array.isArray(config.milestones)) {
        config.milestones.forEach((milestone, idx) => {
            const row = milestonesSheet.getRow(idx + 2);
            
            // Find linked task name if taskIndex is provided
            let linkedTask = '';
            if (milestone.taskIndex !== undefined && config.tasks && config.tasks[milestone.taskIndex]) {
                linkedTask = config.tasks[milestone.taskIndex].name;
            }
            
            row.getCell(1).value = milestone.name || '';
            row.getCell(2).value = milestone.date || '';
            row.getCell(3).value = linkedTask;
            
            // Add data validation (dropdown) to linkedTask column
            row.getCell(3).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`=${taskNamesRange}`],
                showErrorMessage: true,
                errorStyle: 'warning',
                errorTitle: 'Invalid Task',
                error: 'Please select a task from the dropdown list or leave blank.'
            };
            
            row.font = { color: { argb: 'FF2C3E50' } };
            if (idx % 2 === 0) {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
            } else {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
            }
        });
    }
    
    // Apply data validation to all rows in the linkedTask column (for future entries)
    for (let rowNum = 2; rowNum <= 100; rowNum++) {
        const cell = milestonesSheet.getCell(`C${rowNum}`);
        if (!cell.dataValidation) {
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`=${taskNamesRange}`],
                showErrorMessage: true,
                errorStyle: 'warning',
                errorTitle: 'Invalid Task',
                error: 'Please select a task from the dropdown list or leave blank.'
            };
        }
    }
    
    // Set column widths
    milestonesSheet.getColumn('A').width = 25;
    milestonesSheet.getColumn('B').width = 18;
    milestonesSheet.getColumn('C').width = 35;
    
    // ============================================================
    // PAUSE_PERIODS SHEET
    // ============================================================
    const pauseSheet = workbook.addWorksheet('PausePeriods', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });
    
    // Header row
    pauseSheet.getRow(1).values = ['start', 'end'];
    pauseSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    pauseSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } };
    pauseSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    pauseSheet.getRow(1).height = 25;
    
    // Add pause period rows
    if (config.pausePeriods && Array.isArray(config.pausePeriods)) {
        config.pausePeriods.forEach((pause, idx) => {
            const row = pauseSheet.getRow(idx + 2);
            row.values = [pause.start || '', pause.end || ''];
            row.font = { color: { argb: 'FF2C3E50' } };
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
        });
    }
    
    // Set column widths
    pauseSheet.getColumn('A').width = 18;
    pauseSheet.getColumn('B').width = 18;
    
    // ============================================================
    // SAVE FILE
    // ============================================================
    await workbook.xlsx.writeFile(excelPath);
    console.log(`✓ Generated Excel file at ${excelPath}`);
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const inputIndex = args.indexOf('--input') !== -1 ? args.indexOf('--input') : args.indexOf('-i');
    const outputIndex = args.indexOf('--output') !== -1 ? args.indexOf('--output') : args.indexOf('-o');
    
    if (inputIndex === -1 || !args[inputIndex + 1]) {
        console.error('Usage: node scripts/json_to_excel.js --input <file.json> [--output <file.xlsx>]');
        console.error('  --input, -i: Input JSON file');
        console.error('  --output, -o: Output Excel file (optional)');
        process.exit(1);
    }
    
    const inputPath = path.resolve(args[inputIndex + 1]);
    const outputPath = outputIndex !== -1 && args[outputIndex + 1] 
        ? path.resolve(args[outputIndex + 1])
        : inputPath.replace(/\.json$/i, '.xlsx');
    
    jsonToExcel(inputPath, outputPath).catch(error => {
        console.error('✗ Error:', error.message);
        process.exit(1);
    });
}

module.exports = { jsonToExcel };
