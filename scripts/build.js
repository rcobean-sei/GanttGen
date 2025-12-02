#!/usr/bin/env node

/**
 * Unified Gantt Chart Builder
 * Accepts JSON or XLSX input and generates HTML output
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// SEI Color Palette (excluding gray for pause periods)
const SEI_COLORS = ['#E31E26', '#2CABDB', '#38155B', '#0049A3', '#FF6B35'];

// Function to randomly assign colors to tasks ensuring no two adjacent tasks have the same color
function assignTaskColors(numTasks) {
    const colors = [];
    let previousColor = null;
    
    for (let i = 0; i < numTasks; i++) {
        const availableColors = previousColor 
            ? SEI_COLORS.filter(c => c !== previousColor)
            : SEI_COLORS;
        
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        const selectedColor = availableColors[randomIndex];
        
        colors.push(selectedColor);
        previousColor = selectedColor;
    }
    
    return colors;
}

// Collect subtasks from row data
function collectSubtasks(row) {
    const subtasks = [];
    for (let i = 1; i <= 10; i++) {
        const value = row[`subtask${i}`];
        if (value && String(value).trim()) {
            subtasks.push(String(value).trim());
        }
    }
    return subtasks;
}

// Parse Excel file
async function parseExcel(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const data = {};
    
    // Parse Project sheet
    const projectSheet = workbook.getWorksheet('Project');
    if (projectSheet) {
        const projectRow = projectSheet.getRow(2);
        data.title = projectRow.getCell(1).value || 'PROJECT TIMELINE';
        data.timelineStart = String(projectRow.getCell(2).value || '').trim();
        data.timelineEnd = String(projectRow.getCell(3).value || '').trim();
        const showMilestones = projectRow.getCell(4).value;
        data.showMilestones = showMilestones !== undefined ? Boolean(showMilestones) : true;
    }
    
    // Parse Tasks sheet
    const tasksSheet = workbook.getWorksheet('Tasks');
    data.tasks = [];
    if (tasksSheet) {
        tasksSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            
            const name = row.getCell(1).value;
            if (!name || !String(name).trim()) return; // Skip empty rows
            
            const task = {
                name: String(name).trim(),
                start: String(row.getCell(2).value || '').trim(),
                end: String(row.getCell(3).value || '').trim(),
                hours: Number(row.getCell(4).value) || 0
            };
            
            // Collect subtasks
            const subtasks = collectSubtasks({
                subtask1: row.getCell(5).value,
                subtask2: row.getCell(6).value,
                subtask3: row.getCell(7).value,
                subtask4: row.getCell(8).value,
                subtask5: row.getCell(9).value,
                subtask6: row.getCell(10).value,
                subtask7: row.getCell(11).value,
                subtask8: row.getCell(12).value,
                subtask9: row.getCell(13).value,
                subtask10: row.getCell(14).value
            });
            
            if (subtasks.length > 0) {
                task.subtasks = subtasks;
            }
            
            data.tasks.push(task);
        });
    }
    
    // Assign colors to tasks
    if (data.tasks.length > 0) {
        const assignedColors = assignTaskColors(data.tasks.length);
        data.tasks.forEach((task, idx) => {
            task.color = assignedColors[idx];
        });
    }
    
    // Parse Milestones sheet
    const milestonesSheet = workbook.getWorksheet('Milestones');
    data.milestones = [];
    if (milestonesSheet) {
        milestonesSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            
            const name = row.getCell(1).value;
            if (!name || !String(name).trim()) return; // Skip empty rows
            
            const milestone = {
                name: String(name).trim().replace(/\\n/g, '\n'),
                date: String(row.getCell(2).value || '').trim()
            };
            
            // Get linkedTask (task name from dropdown)
            const linkedTask = row.getCell(3).value;
            if (linkedTask && String(linkedTask).trim()) {
                // Find task index by matching task name
                const taskIndex = data.tasks.findIndex(t => t.name === String(linkedTask).trim());
                if (taskIndex >= 0) {
                    milestone.taskIndex = taskIndex;
                }
            }
            
            data.milestones.push(milestone);
        });
    }
    
    // Parse PausePeriods sheet
    const pauseSheet = workbook.getWorksheet('PausePeriods');
    data.pausePeriods = [];
    if (pauseSheet) {
        pauseSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            
            const start = row.getCell(1).value;
            const end = row.getCell(2).value;
            if (!start || !end) return; // Skip empty rows
            
            data.pausePeriods.push({
                start: String(start).trim(),
                end: String(end).trim()
            });
        });
    }
    
    return data;
}

// Parse JSON file
function parseJSON(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
}

// Validate config
function validateConfig(config) {
    const errors = [];
    
    if (!config.title) errors.push('Missing required field: title');
    if (!config.timelineStart) errors.push('Missing required field: timelineStart');
    if (!config.timelineEnd) errors.push('Missing required field: timelineEnd');
    
    if (config.timelineStart && config.timelineEnd) {
        const start = new Date(config.timelineStart);
        const end = new Date(config.timelineEnd);
        if (start >= end) {
            errors.push('timelineStart must be before timelineEnd');
        }
    }
    
    if (!config.tasks || !Array.isArray(config.tasks)) {
        errors.push('Missing or invalid tasks array');
    } else {
        config.tasks.forEach((task, idx) => {
            if (!task.name) errors.push(`Task ${idx + 1}: Missing name`);
            if (!task.start) errors.push(`Task ${idx + 1}: Missing start date`);
            if (!task.end) errors.push(`Task ${idx + 1}: Missing end date`);
            if (!task.color) errors.push(`Task ${idx + 1}: Missing color`);
            
            if (task.start && task.end) {
                const start = new Date(task.start);
                const end = new Date(task.end);
                if (start >= end) {
                    errors.push(`Task ${idx + 1} (${task.name}): start date must be before end date`);
                }
            }
        });
    }
    
    if (errors.length > 0) {
        throw new Error('Validation errors:\n' + errors.map(e => `  - ${e}`).join('\n'));
    }
}

// Generate HTML from config
function generateHTML(config, templatePath, outputPath) {
    const template = fs.readFileSync(templatePath, 'utf8');
    const configJson = JSON.stringify(config, null, 4);
    const output = template.replace('{{CONFIG}}', configJson);
    
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, output, 'utf8');
}

// Main function
async function build(inputPath, outputPath) {
    const inputExt = path.extname(inputPath).toLowerCase();
    const isExcel = inputExt === '.xlsx' || inputExt === '.xls';
    const isJSON = inputExt === '.json';
    
    if (!isExcel && !isJSON) {
        throw new Error(`Unsupported file format: ${inputExt}. Expected .json or .xlsx`);
    }
    
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
    }
    
    console.log(`📖 Reading ${isExcel ? 'Excel' : 'JSON'} file: ${inputPath}`);
    
    // Parse input
    let config;
    if (isExcel) {
        config = await parseExcel(inputPath);
        console.log('✓ Parsed Excel file');
    } else {
        config = parseJSON(inputPath);
        console.log('✓ Parsed JSON file');
    }
    
    // Validate
    console.log('✓ Validating configuration...');
    validateConfig(config);
    console.log('✓ Validation passed');
    
    // Generate HTML
    const templatePath = path.join(__dirname, '..', 'templates', 'gantt_template.html');
    const htmlOutputPath = outputPath || path.join(__dirname, '..', 'output', 'gantt_chart.html');
    
    console.log('✓ Generating HTML...');
    generateHTML(config, templatePath, htmlOutputPath);
    console.log(`✓ Generated HTML at ${htmlOutputPath}`);
    
    // Optionally save JSON config
    const jsonOutputPath = path.join(__dirname, '..', 'config', 'project.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✓ Saved config to ${jsonOutputPath}`);
    
    console.log(`\n  To preview: open ${htmlOutputPath} in a browser`);
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const inputIndex = args.indexOf('--input') !== -1 ? args.indexOf('--input') : args.indexOf('-i');
    const outputIndex = args.indexOf('--output') !== -1 ? args.indexOf('--output') : args.indexOf('-o');
    
    if (inputIndex === -1 || !args[inputIndex + 1]) {
        console.error('Usage: node scripts/build.js --input <file.json|file.xlsx> [--output <output.html>]');
        console.error('  --input, -i: Input file (JSON or XLSX)');
        console.error('  --output, -o: Output HTML file (optional, defaults to output/gantt_chart.html)');
        process.exit(1);
    }
    
    const inputPath = path.resolve(args[inputIndex + 1]);
    const outputPath = outputIndex !== -1 && args[outputIndex + 1] 
        ? path.resolve(args[outputIndex + 1])
        : null;
    
    build(inputPath, outputPath).catch(error => {
        console.error('✗ Error:', error.message);
        process.exit(1);
    });
}

module.exports = { build, parseExcel, parseJSON };

