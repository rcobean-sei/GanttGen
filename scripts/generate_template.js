const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const outputPath = path.join(__dirname, '../templates/gantt_template.xlsx');

// SEI Color Palette (excluding gray for pause periods)
const SEI_COLORS = ['#E31E26', '#2CABDB', '#38155B', '#0049A3', '#FF6B35'];

// Function to randomly assign colors to tasks ensuring no two adjacent tasks have the same color
function assignTaskColors(numTasks) {
    const colors = [];
    let previousColor = null;
    
    for (let i = 0; i < numTasks; i++) {
        // Get available colors (exclude the previous color)
        const availableColors = previousColor 
            ? SEI_COLORS.filter(c => c !== previousColor)
            : SEI_COLORS;
        
        // Randomly select from available colors
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        const selectedColor = availableColors[randomIndex];
        
        colors.push(selectedColor);
        previousColor = selectedColor;
    }
    
    return colors;
}

// Example task data (before color assignment) - Beverage Machine Upgrade Project
const exampleTaskDataRaw = [
    {
        name: 'Planning & Vendor Selection',
        start: '2025-01-06',
        end: '2025-01-24',
        hours: 30,
        subtasks: [
            'Research beverage machine vendors and models',
            'Compare features, pricing, and maintenance requirements',
            'Schedule vendor demos and site visits',
            'Evaluate compatibility with existing POS systems',
            'Select vendor and negotiate contract terms'
        ]
    },
    {
        name: 'Site Preparation & Installation',
        start: '2025-01-27',
        end: '2025-02-21',
        hours: 40,
        subtasks: [
            'Coordinate with facilities team for electrical and plumbing requirements',
            'Schedule installation during off-peak hours',
            'Remove old beverage machine and dispose of equipment',
            'Install new machine and connect to utilities',
            'Test all connections and basic functionality'
        ]
    },
    {
        name: 'System Integration & Testing',
        start: '2025-02-24',
        end: '2025-03-07',
        hours: 25,
        subtasks: [
            'Integrate new machine with POS system',
            'Configure menu items and pricing',
            'Test payment processing and receipt printing',
            'Train staff on new machine operation',
            'Conduct end-to-end testing with real orders'
        ]
    }
];

// Assign random colors to tasks (ensuring no two adjacent tasks have the same color)
const assignedColors = assignTaskColors(exampleTaskDataRaw.length);
const exampleTaskData = exampleTaskDataRaw.map((task, idx) => ({
    ...task,
    color: assignedColors[idx]
}));

// Create workbook
const workbook = new ExcelJS.Workbook();

// ============================================================
// INSTRUCTIONS SHEET
// ============================================================
const instructionsSheet = workbook.addWorksheet('📋 INSTRUCTIONS', {
    views: [{ state: 'frozen', ySplit: 1 }]
});

// Style definitions
const headerStyle = {
    font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: { bottom: { style: 'medium', color: { argb: 'FF000000' } } }
};

const sectionStyle = {
    font: { bold: true, size: 12, color: { argb: 'FF2C3E50' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECF0F1' } },
    alignment: { vertical: 'middle', horizontal: 'left', wrapText: true },
    border: { all: { style: 'thin', color: { argb: 'FFBDC3C7' } } }
};

const infoStyle = {
    font: { size: 11, color: { argb: 'FF34495E' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
    alignment: { vertical: 'top', horizontal: 'left', wrapText: true },
    border: { all: { style: 'thin', color: { argb: 'FFE0E0E0' } } }
};

const warningStyle = {
    font: { size: 11, color: { argb: 'FFE67E22' }, bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4E6' } },
    alignment: { vertical: 'top', horizontal: 'left', wrapText: true },
    border: { all: { style: 'thin', color: { argb: 'FFFFB84D' } } }
};

const successStyle = {
    font: { size: 11, color: { argb: 'FF27AE60' }, bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F8F5' } },
    alignment: { vertical: 'top', horizontal: 'left', wrapText: true },
    border: { all: { style: 'thin', color: { argb: 'FF52BE80' } } }
};

// Title
instructionsSheet.mergeCells('A1:F1');
instructionsSheet.getCell('A1').value = '📊 GANTT CHART TEMPLATE - INSTRUCTIONS';
instructionsSheet.getCell('A1').style = headerStyle;
instructionsSheet.getRow(1).height = 30;

let row = 3;

// Overview
instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = 'OVERVIEW';
instructionsSheet.getCell(`A${row}`).style = sectionStyle;
instructionsSheet.getRow(row).height = 25;
row++;

instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = 'This template allows you to create a professional Gantt chart by filling in the data sheets below. Each sheet has a specific purpose:\n\n' +
    '• PROJECT: Set the overall timeline and chart settings\n' +
    '• TASKS: Define your project tasks with dates and subtasks (colors are assigned automatically)\n' +
    '• MILESTONES: Mark important project milestones\n' +
    '• PAUSE_PERIODS: Define any breaks or holidays (optional)';
instructionsSheet.getCell(`A${row}`).style = infoStyle;
instructionsSheet.getRow(row).height = 100;
row += 2;

// SEI Color Palette
instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = '🎨 SEI COLOR PALETTE';
instructionsSheet.getCell(`A${row}`).style = sectionStyle;
instructionsSheet.getRow(row).height = 25;
row++;

// Color palette header
instructionsSheet.getCell(`A${row}`).value = 'Color';
instructionsSheet.getCell(`A${row}`).style = {
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: { all: { style: 'thin', color: { argb: 'FF000000' } } }
};
instructionsSheet.getCell(`B${row}`).value = 'Hex Code';
instructionsSheet.getCell(`B${row}`).style = {
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: { all: { style: 'thin', color: { argb: 'FF000000' } } }
};
instructionsSheet.getCell(`C${row}`).value = 'Name';
instructionsSheet.getCell(`C${row}`).style = {
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: { all: { style: 'thin', color: { argb: 'FF000000' } } }
};
instructionsSheet.mergeCells(`D${row}:F${row}`);
instructionsSheet.getCell(`D${row}`).value = 'Usage';
instructionsSheet.getCell(`D${row}`).style = {
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: { all: { style: 'thin', color: { argb: 'FF000000' } } }
};
instructionsSheet.getRow(row).height = 25;
row++;

// SEI Color Palette - Define colors
const seiColors = [
    { hex: 'E31E26', name: 'Red', usage: 'Primary task color' },
    { hex: '2CABDB', name: 'Cyan', usage: 'Primary task color' },
    { hex: '38155B', name: 'Dark Purple', usage: 'Primary task color' },
    { hex: '0049A3', name: 'Blue', usage: 'Primary task color' },
    { hex: 'FF6B35', name: 'Coral/Orange', usage: 'Primary task color' },
    { hex: '6C757D', name: 'Gray', usage: 'Pause periods, neutral elements' }
];

seiColors.forEach((color, idx) => {
    // Color swatch cell
    instructionsSheet.getCell(`A${row}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${color.hex}` }
    };
    instructionsSheet.getCell(`A${row}`).border = {
        all: { style: 'thin', color: { argb: 'FF000000' } }
    };
    instructionsSheet.getRow(row).height = 30;
    
    // Hex code
    instructionsSheet.getCell(`B${row}`).value = `#${color.hex}`;
    instructionsSheet.getCell(`B${row}`).style = {
        font: { size: 11, color: { argb: 'FF2C3E50' }, fontFamily: 'Courier New' },
        alignment: { vertical: 'middle', horizontal: 'center' },
        border: { all: { style: 'thin', color: { argb: 'FFE0E0E0' } } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    };
    
    // Color name
    instructionsSheet.getCell(`C${row}`).value = color.name;
    instructionsSheet.getCell(`C${row}`).style = {
        font: { size: 11, color: { argb: 'FF2C3E50' } },
        alignment: { vertical: 'middle', horizontal: 'left' },
        border: { all: { style: 'thin', color: { argb: 'FFE0E0E0' } } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    };
    
    // Usage
    instructionsSheet.mergeCells(`D${row}:F${row}`);
    instructionsSheet.getCell(`D${row}`).value = color.usage;
    instructionsSheet.getCell(`D${row}`).style = {
        font: { size: 11, color: { argb: 'FF2C3E50' } },
        alignment: { vertical: 'middle', horizontal: 'left' },
        border: { all: { style: 'thin', color: { argb: 'FFE0E0E0' } } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    };
    
    row++;
});

// Add note about automatic color assignment
instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = '💡 TIP: Colors shown above are from the SEI palette. Task colors are automatically assigned from this palette when you import the data - no manual selection needed!';
instructionsSheet.getCell(`A${row}`).style = {
    font: { size: 10, color: { argb: 'FF7F8C8D' }, italic: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
    alignment: { vertical: 'middle', horizontal: 'left', wrapText: true },
    border: { all: { style: 'thin', color: { argb: 'FFE0E0E0' } } }
};
instructionsSheet.getRow(row).height = 40;
row += 2;

// Project Sheet Instructions
instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = '📅 PROJECT SHEET';
instructionsSheet.getCell(`A${row}`).style = sectionStyle;
instructionsSheet.getRow(row).height = 25;
row++;

instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = 'Fill in ONE row with your project details:\n\n' +
    '• title: The chart title (e.g., "PROJECT TIMELINE")\n' +
    '• timelineStart: Start date in YYYY-MM-DD format (e.g., "2025-01-06")\n' +
    '• timelineEnd: End date in YYYY-MM-DD format (e.g., "2025-03-14")\n' +
    '• showMilestones: true or false (default: true)';
instructionsSheet.getCell(`A${row}`).style = infoStyle;
instructionsSheet.getRow(row).height = 120;
row += 2;

// Tasks Sheet Instructions
instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = '✅ TASKS SHEET';
instructionsSheet.getCell(`A${row}`).style = sectionStyle;
instructionsSheet.getRow(row).height = 25;
row++;

instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = 'Add one row per task. Each task needs:\n\n' +
    '• name: Task name (e.g., "Planning & Vendor Selection")\n' +
    '• start: Start date in YYYY-MM-DD format (e.g., "2025-01-06")\n' +
    '• end: End date in YYYY-MM-DD format (e.g., "2025-01-24")\n' +
    '• hours: Estimated hours (number, e.g., 30)\n' +
    '• subtask1 through subtask10: Optional subtasks (up to 10 per task)\n\n' +
    '💡 TIP: Colors are automatically assigned! Each task gets a unique color from the SEI palette, and no two adjacent tasks will have the same color.\n' +
    '💡 TIP: Leave subtask columns empty if you have fewer than 10 subtasks.';
instructionsSheet.getCell(`A${row}`).style = infoStyle;
instructionsSheet.getRow(row).height = 180;
row += 2;

// Milestones Sheet Instructions
instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = '🎯 MILESTONES SHEET';
instructionsSheet.getCell(`A${row}`).style = sectionStyle;
instructionsSheet.getRow(row).height = 25;
row++;

instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = 'Add one row per milestone:\n\n' +
    '• name: Milestone name (use \\n for line breaks, e.g., "Project\\nKickoff")\n' +
    '• date: Milestone date in YYYY-MM-DD format (e.g., "2025-01-06")\n' +
    '• linkedTask: Select the associated task from the dropdown list (or leave blank)\n\n' +
    '💡 TIP: The linkedTask column has a dropdown menu showing all tasks from the Tasks sheet. Simply click the cell and select from the list!\n' +
    '💡 TIP: You can leave linkedTask blank if the milestone is not associated with a specific task.';
instructionsSheet.getCell(`A${row}`).style = infoStyle;
instructionsSheet.getRow(row).height = 160;
row += 2;

// Pause Periods Sheet Instructions
instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = '⏸️ PAUSE_PERIODS SHEET (Optional)';
instructionsSheet.getCell(`A${row}`).style = sectionStyle;
instructionsSheet.getRow(row).height = 25;
row++;

instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = 'Add one row per pause/break period:\n\n' +
    '• start: Pause start date in YYYY-MM-DD format (e.g., "2025-02-15")\n' +
    '• end: Pause end date in YYYY-MM-DD format (e.g., "2025-02-17")\n\n' +
    '💡 TIP: Leave this sheet empty if you have no pause periods. Tasks that span a pause will automatically show a break effect.';
instructionsSheet.getCell(`A${row}`).style = infoStyle;
instructionsSheet.getRow(row).height = 120;
row += 2;

// Important Notes
instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = '⚠️ IMPORTANT NOTES';
instructionsSheet.getCell(`A${row}`).style = warningStyle;
instructionsSheet.getRow(row).height = 25;
row++;

instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = '• Dates MUST be in YYYY-MM-DD format (e.g., "2025-12-01", not "12/1/2025")\n' +
    '• Task start dates must be before end dates\n' +
    '• All task dates must fall within the timeline range\n' +
    '• Task colors are automatically assigned from the SEI palette - no manual selection needed\n' +
    '• Milestone linking uses a dropdown - select the associated task from the list\n' +
    '• Use \\n in milestone names for line breaks (not actual line breaks)';
instructionsSheet.getCell(`A${row}`).style = warningStyle;
instructionsSheet.getRow(row).height = 140;
row += 2;

// Next Steps
instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = '✅ NEXT STEPS';
instructionsSheet.getCell(`A${row}`).style = successStyle;
instructionsSheet.getRow(row).height = 25;
row++;

instructionsSheet.mergeCells(`A${row}:F${row}`);
instructionsSheet.getCell(`A${row}`).value = '1. Fill in the PROJECT sheet with your timeline\n' +
    '2. Add your tasks in the TASKS sheet (you can delete the example rows)\n' +
    '3. Add milestones in the MILESTONES sheet (optional)\n' +
    '4. Add pause periods in the PAUSE_PERIODS sheet (optional)\n' +
    '5. Save the file\n' +
    '6. Run: npm run import -- --input templates/gantt_template.xlsx\n' +
    '7. Run: npm run build\n' +
    '8. Open output/gantt_chart.html in your browser';
instructionsSheet.getCell(`A${row}`).style = successStyle;
instructionsSheet.getRow(row).height = 160;

// Set column widths
instructionsSheet.getColumn('A').width = 100;

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

// Add comments/notes to header cells
projectSheet.getCell('A1').note = 'Chart title (e.g., "PROJECT TIMELINE")';
projectSheet.getCell('B1').note = 'Start date in YYYY-MM-DD format (e.g., "2025-01-06")';
projectSheet.getCell('C1').note = 'End date in YYYY-MM-DD format (e.g., "2025-03-14")';
projectSheet.getCell('D1').note = 'Show milestones? (true or false)';

// Example data row
projectSheet.getRow(2).values = ['PROJECT TIMELINE', '2025-01-06', '2025-03-14', true];
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

// Header row (removed 'color' column - colors assigned automatically)
const taskHeaders = ['name', 'start', 'end', 'hours', 
    'subtask1', 'subtask2', 'subtask3', 'subtask4', 'subtask5',
    'subtask6', 'subtask7', 'subtask8', 'subtask9', 'subtask10'];
tasksSheet.getRow(1).values = taskHeaders;
tasksSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
tasksSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27AE60' } };
tasksSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
tasksSheet.getRow(1).height = 30;

// Add comments to important header cells
tasksSheet.getCell('A1').note = 'Task name';
tasksSheet.getCell('B1').note = 'Start date in YYYY-MM-DD format';
tasksSheet.getCell('C1').note = 'End date in YYYY-MM-DD format';
tasksSheet.getCell('D1').note = 'Estimated hours (number)';
tasksSheet.getCell('E1').note = 'First subtask (optional)';
tasksSheet.getCell('F1').note = 'Second subtask (optional)';

// Build example tasks array (without color column)
const exampleTasks = exampleTaskData.map(task => {
    const row = [
        task.name,
        task.start,
        task.end,
        task.hours
    ];
    
    // Add subtasks (up to 10)
    for (let i = 0; i < 10; i++) {
        row.push(task.subtasks[i] || '');
    }
    
    return row;
});

// Assign colors to rows and add data
exampleTasks.forEach((taskRow, idx) => {
    const row = tasksSheet.getRow(idx + 2);
    row.values = taskRow;
    
    // Get the assigned color for this task
    const taskColor = exampleTaskData[idx].color;
    const colorHex = taskColor.substring(1);
    
    // Convert hex to ARGB for a subtle tint (mix with white for lighter background)
    // Use 20% opacity of the color mixed with white background
    const colorArgb = `FF${colorHex}`;
    
    // Create a lighter tint by mixing the color with white (85% white, 15% color)
    // This makes the background subtle while still showing the color
    const tintedArgb = `FFF5F5F5`; // Very light gray as base, we'll use a pattern instead
    
    // Set text color (always dark for readability on light background)
    row.font = { color: { argb: 'FF2C3E50' }, bold: false };
    
    // Fill row with a very light tint of the task color
    // Use a pattern fill with the color at low opacity, or use a lighter version
    // For simplicity, use a light background with a colored left border indicator
    row.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FFF8F9FA' } // Light gray background
    };
    
    // Add a colored left border to indicate the task color
    row.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'medium', color: { argb: colorArgb } }, // Colored left border
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    };
    
    // Add subtle border
    row.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    };
});

// Set column widths (adjusted for removed color column)
tasksSheet.getColumn('A').width = 35;
tasksSheet.getColumn('B').width = 15;
tasksSheet.getColumn('C').width = 15;
tasksSheet.getColumn('D').width = 10;
for (let i = 5; i <= 14; i++) {
    tasksSheet.getColumn(i).width = 40;
}

// ============================================================
// MILESTONES SHEET
// ============================================================
const milestonesSheet = workbook.addWorksheet('Milestones', {
    views: [{ state: 'frozen', ySplit: 1 }]
});

// Header row (removed taskIndex, added linkedTask with dropdown)
milestonesSheet.getRow(1).values = ['name', 'date', 'linkedTask'];
milestonesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
milestonesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9B59B6' } };
milestonesSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
milestonesSheet.getRow(1).height = 25;

// Add comments
milestonesSheet.getCell('A1').note = 'Milestone name (use \\n for line breaks)';
milestonesSheet.getCell('B1').note = 'Milestone date in YYYY-MM-DD format';
milestonesSheet.getCell('C1').note = 'Select the task this milestone is associated with (dropdown list from Tasks sheet)';

// Create a named range for task names (for dropdown validation)
// We'll reference Tasks!A2:A1000 to allow for many tasks
const taskNamesRange = 'Tasks!$A$2:$A$1000';

// Example data rows
const exampleMilestones = [
    ['Project\nKickoff', '2025-01-06', 'Planning & Vendor Selection'],
    ['Installation\nComplete', '2025-02-21', 'Site Preparation & Installation'],
    ['Go Live', '2025-03-14', 'Staff Training & Documentation'],
];

exampleMilestones.forEach((milestone, idx) => {
    const row = milestonesSheet.getRow(idx + 2);
    
    // Set name, date, and linkedTask
    row.getCell(1).value = milestone[0];
    row.getCell(2).value = milestone[1];
    row.getCell(3).value = milestone[2];
    
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

// Apply data validation to all rows in the linkedTask column (for future entries)
// We'll set it for rows 2-100 to allow for many milestones
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
milestonesSheet.getColumn('C').width = 35; // Wider for task names

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

// Add comments
pauseSheet.getCell('A1').note = 'Pause start date in YYYY-MM-DD format';
pauseSheet.getCell('B1').note = 'Pause end date in YYYY-MM-DD format';

// Example data row
pauseSheet.getRow(2).values = ['2025-02-15', '2025-02-17'];
pauseSheet.getRow(2).font = { color: { argb: 'FF2C3E50' } };
pauseSheet.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };

// Set column widths
pauseSheet.getColumn('A').width = 18;
pauseSheet.getColumn('B').width = 18;

// ============================================================
// SAVE FILE
// ============================================================
async function generateTemplate() {
    try {
        await workbook.xlsx.writeFile(outputPath);
        console.log(`✓ Generated Excel template at ${outputPath}`);
        console.log(`\n  The template includes:`);
        console.log(`  • 📋 INSTRUCTIONS sheet with detailed guidance`);
        console.log(`  • 📅 Project sheet with example data`);
        console.log(`  • ✅ Tasks sheet with example tasks`);
        console.log(`  • 🎯 Milestones sheet with example milestones`);
        console.log(`  • ⏸️  PausePeriods sheet with example pause period`);
        console.log(`\n  Opening the file...`);
        
        // Open the Excel file
        exec(`open "${outputPath}"`, (error) => {
            if (error) {
                console.warn(`  ⚠️  Could not automatically open the file: ${error.message}`);
                console.log(`  Please manually open: ${outputPath}`);
            } else {
                console.log(`  ✓ Opened in Excel`);
            }
        });
    } catch (error) {
        console.error('Error generating template:', error);
        process.exit(1);
    }
}

generateTemplate();

