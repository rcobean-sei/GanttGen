#!/usr/bin/env node

/**
 * Unified Gantt Chart Builder
 * Accepts JSON or XLSX input and generates HTML output
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const ExcelJS = require('exceljs');

// Optional Playwright for PNG export
let playwright;
try {
    playwright = require('playwright');
} catch (e) {
    // Playwright not installed - PNG export will be skipped
    playwright = null;
}

// Find system-installed Chrome or Edge for Playwright
function findSystemBrowser() {
    const platform = os.platform();
    
    const browserPaths = {
        darwin: [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ],
        win32: [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
            (process.env.LOCALAPPDATA || '') + '\\Microsoft\\Edge\\Application\\msedge.exe'
        ],
        linux: [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/usr/bin/microsoft-edge',
            '/usr/bin/microsoft-edge-stable'
        ]
    };
    
    const paths = browserPaths[platform] || [];
    
    // Check common installation paths
    for (const browserPath of paths) {
        if (browserPath && fs.existsSync(browserPath)) {
            return browserPath;
        }
    }
    
    // Try to find via system commands
    try {
        if (platform === 'darwin') {
            // Use mdfind on macOS
            try {
                const chrome = execSync('mdfind "kMDItemCFBundleIdentifier == \'com.google.Chrome\'" 2>/dev/null', { encoding: 'utf8' }).trim();
                if (chrome) {
                    const chromePath = chrome.split('\n')[0];
                    return path.join(chromePath, 'Contents/MacOS/Google Chrome');
                }
            } catch (e) {}
            
            try {
                const edge = execSync('mdfind "kMDItemCFBundleIdentifier == \'com.microsoft.edgemac\'" 2>/dev/null', { encoding: 'utf8' }).trim();
                if (edge) {
                    const edgePath = edge.split('\n')[0];
                    return path.join(edgePath, 'Contents/MacOS/Microsoft Edge');
                }
            } catch (e) {}
        } else if (platform === 'linux') {
            // Use which command on Linux
            try {
                const chrome = execSync('which google-chrome 2>/dev/null', { encoding: 'utf8' }).trim();
                if (chrome) return chrome;
            } catch (e) {
                try {
                    const chromium = execSync('which chromium 2>/dev/null', { encoding: 'utf8' }).trim();
                    if (chromium) return chromium;
                } catch (e) {
                    try {
                        const edge = execSync('which microsoft-edge 2>/dev/null', { encoding: 'utf8' }).trim();
                        if (edge) return edge;
                    } catch (e) {}
                }
            }
        }
    } catch (e) {
        // Ignore errors
    }
    
    return null;
}

// ============================================================
// BRAND COLOR PALETTES
// ============================================================

// Individual brand colors for reference
const BRAND = {
    RED_1: '#F01840',    // Bright red
    RED_2: '#C01830',    // Darker red
    RED_3: '#901226',    // Burgundy
    RED_4: '#600C1C',    // Dark burgundy
    RED_5: '#300810',    // Very dark burgundy
    PURPLE_1: '#D0C8C8', // Light mauve
    PURPLE_2: '#A0949E', // Muted purple
    PURPLE_3: '#705E74', // Medium purple
    PURPLE_4: '#402848', // Dark purple
    PURPLE_5: '#2A1C30', // Deep purple
    CREAM: '#FFFFF8',
    BLACK: '#141018'
};

// Preset palettes
const PALETTE_PRESETS = {
    // Red gradient A - plain (warm, attention-grabbing)
    reds_a: [
        BRAND.RED_1,     // Bright red
        BRAND.RED_2,     // Darker red
        BRAND.RED_3,     // Burgundy
        BRAND.RED_4,     // Dark burgundy
        BRAND.RED_5,     // Very dark burgundy
        BRAND.RED_1      // Cycle back to bright
    ],
    
    // Red gradient B - with purple left border accent
    reds_b: [
        BRAND.RED_1,     // Bright red
        BRAND.RED_2,     // Darker red
        BRAND.RED_3,     // Burgundy
        BRAND.RED_4,     // Dark burgundy
        BRAND.RED_5,     // Very dark burgundy
        BRAND.RED_1      // Cycle back to bright
    ],
    
    // Red gradient (alias for reds_a)
    reds: [
        BRAND.RED_1,     // Bright red
        BRAND.RED_2,     // Darker red
        BRAND.RED_3,     // Burgundy
        BRAND.RED_4,     // Dark burgundy
        BRAND.RED_5,     // Very dark burgundy
        BRAND.RED_1      // Cycle back to bright
    ],
    
    // Purple gradient A - burgundy task name text accent
    purples_a: [
        BRAND.PURPLE_3,  // Medium purple
        BRAND.PURPLE_4,  // Dark purple
        BRAND.PURPLE_5,  // Deep purple
        BRAND.PURPLE_3,  // Medium purple
        BRAND.PURPLE_4,  // Dark purple
        BRAND.PURPLE_5   // Deep purple
    ],
    
    // Purple gradient B - left border accent only
    purples_b: [
        BRAND.PURPLE_3,  // Medium purple
        BRAND.PURPLE_4,  // Dark purple
        BRAND.PURPLE_5,  // Deep purple
        BRAND.PURPLE_3,  // Medium purple
        BRAND.PURPLE_4,  // Dark purple
        BRAND.PURPLE_5   // Deep purple
    ],
    
    // Purple gradient C - both burgundy text AND left border
    purples_c: [
        BRAND.PURPLE_3,  // Medium purple
        BRAND.PURPLE_4,  // Dark purple
        BRAND.PURPLE_5,  // Deep purple
        BRAND.PURPLE_3,  // Medium purple
        BRAND.PURPLE_4,  // Dark purple
        BRAND.PURPLE_5   // Deep purple
    ],
    
    // Alternating red/purple - maximum visual distinction
    alternating: [
        BRAND.RED_1,     // Bright red
        BRAND.PURPLE_4,  // Dark purple
        BRAND.RED_2,     // Darker red
        BRAND.PURPLE_3,  // Medium purple
        BRAND.RED_3,     // Burgundy
        BRAND.PURPLE_5   // Deep purple
    ],
    
    // Alternating red/purple B - with red left border accent
    alternating_b: [
        BRAND.RED_1,     // Bright red
        BRAND.PURPLE_4,  // Dark purple
        BRAND.RED_2,     // Darker red
        BRAND.PURPLE_3,  // Medium purple
        BRAND.RED_3,     // Burgundy
        BRAND.PURPLE_5   // Deep purple
    ]
};

// Default palette (alternating for best visual distinction)
const BRAND_COLORS = PALETTE_PRESETS.alternating;

// Get palette by name, with fallback to alternating
function getPaletteByName(name) {
    if (!name) return null; // Use config palette
    const normalized = name.toLowerCase().trim();
    if (PALETTE_PRESETS[normalized]) {
        return PALETTE_PRESETS[normalized];
    }
    console.warn(`⚠️  Unknown palette "${name}", using "alternating"`);
    return PALETTE_PRESETS.alternating;
}

// Function to randomly assign colors to tasks ensuring no two adjacent tasks have the same color
function assignTaskColors(numTasks) {
    const colors = [];
    let previousColor = null;
    
    for (let i = 0; i < numTasks; i++) {
        const availableColors = previousColor 
            ? BRAND_COLORS.filter(c => c !== previousColor)
            : BRAND_COLORS;
        
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
    
    // Parse Palette sheet (must be first to resolve color indices)
    const paletteSheet = workbook.getWorksheet('Palette');
    data.palette = [];
    if (paletteSheet) {
        paletteSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const color = row.getCell(1).value;
            if (color && String(color).trim()) {
                data.palette.push(String(color).trim());
            }
        });
    }
    // If no palette defined, use default SEI colors
    if (data.palette.length === 0) {
        data.palette = BRAND_COLORS;
    }
    
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
            
            // Get color - can be either direct color value or colorIndex
            // Column 15 = color, Column 16 = colorIndex
            const colorValue = row.getCell(15).value;
            const colorIndexValue = row.getCell(16).value;
            
            if (colorIndexValue !== undefined && colorIndexValue !== null && colorIndexValue !== '') {
                // Use palette index (preferred)
                const colorIndex = Number(colorIndexValue);
                if (!isNaN(colorIndex) && colorIndex >= 0 && colorIndex < data.palette.length) {
                    task.color = data.palette[colorIndex];
                }
            } else if (colorValue && String(colorValue).trim()) {
                // Use direct color value (fallback)
                task.color = String(colorValue).trim();
            }
            
            data.tasks.push(task);
        });
    }
    
    // Assign colors to tasks that don't have colors yet
    if (data.tasks.length > 0) {
        const assignedColors = assignTaskColors(data.tasks.length);
        data.tasks.forEach((task, idx) => {
            if (!task.color) {
                // Use palette if available, otherwise use assigned colors
                if (data.palette && data.palette.length > 0) {
                    task.color = data.palette[idx % data.palette.length];
                } else {
                    task.color = assignedColors[idx];
                }
            }
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
    const config = JSON.parse(content);
    
    // Resolve color indices to actual colors if palette is defined
    if (config.palette && Array.isArray(config.palette) && config.palette.length > 0) {
        if (config.tasks && Array.isArray(config.tasks)) {
            config.tasks.forEach(task => {
                // Prefer colorIndex over direct color when both are present
                if (task.colorIndex !== undefined) {
                    const colorIndex = Number(task.colorIndex);
                    if (!isNaN(colorIndex) && colorIndex >= 0 && colorIndex < config.palette.length) {
                        task.color = config.palette[colorIndex];
                    }
                } else if (!task.color) {
                    // If task has neither color nor colorIndex, assign from palette
                    const taskIndex = config.tasks.indexOf(task);
                    task.color = config.palette[taskIndex % config.palette.length];
                }
            });
        }
    } else if (!config.palette) {
        // If no palette defined, use default SEI colors
        config.palette = BRAND_COLORS;
        // Assign colors to tasks that don't have them
        if (config.tasks && Array.isArray(config.tasks)) {
            config.tasks.forEach((task, idx) => {
                if (!task.color) {
                    task.color = config.palette[idx % config.palette.length];
                }
            });
        }
    }
    
    return config;
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

// Crop PNG to visible pixels only (remove transparent space)
async function cropPNGToVisible(pngPath) {
    try {
        const sharp = require('sharp');
        const image = sharp(pngPath);
        const metadata = await image.metadata();
        
        // Trim transparent pixels (threshold: 0 means fully transparent)
        const trimmed = await image.trim({ threshold: 0 }).toBuffer();
        
        // Write back to file
        fs.writeFileSync(pngPath, trimmed);
        return true;
    } catch (error) {
        // If sharp is not available, skip cropping silently
        return false;
    }
}

// Export HTML to PNG with transparent background
async function exportPNG(htmlPath, pngPath) {
    if (!playwright) {
        throw new Error('Playwright is not installed');
    }
    
    // Try to find system browser first
    const systemBrowser = findSystemBrowser();
    const launchOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };
    
    if (systemBrowser) {
        launchOptions.executablePath = systemBrowser;
        console.log(`   Using system browser: ${path.basename(systemBrowser)}`);
    } else {
        console.log('   Using Playwright bundled Chromium');
    }
    
    let browser;
    try {
        // Launch Chromium browser (use system browser if available, otherwise use bundled)
        browser = await playwright.chromium.launch(launchOptions);
        
        const context = await browser.newContext({
            viewport: {
                width: 1920,
                height: 1080
            },
            deviceScaleFactor: 2 // Higher DPI for better quality
        });
        
        const page = await context.newPage();
        
        // Load the HTML file
        const fileUrl = `file://${path.resolve(htmlPath)}`;
        await page.goto(fileUrl, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        // Wait for page to be fully loaded and rendered
        await page.waitForFunction(() => {
            const timeline = document.querySelector('.milestone-timeline');
            const milestones = document.querySelectorAll('.milestone-label');
            return document.readyState === 'complete' && 
                   timeline !== null &&
                   milestones.length > 0;
        }, { timeout: 10000 });
        
        // Wait for initial layout to settle
        await page.waitForTimeout(500);
        
        // Trigger a resize event to ensure connectors are calculated with the current viewport
        // The debounced resize handler will recalculate connectors after layout stabilizes
        await page.evaluate(() => {
            window.dispatchEvent(new Event('resize'));
        });
        
        // Wait for the debounced resize handler and double RAF to complete
        await page.waitForTimeout(200); // Wait for debounce (50ms) + buffer
        await page.evaluate(() => {
            return new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resolve();
                    });
                });
            });
        });
        
        // Final delay to ensure rendering is complete
        await page.waitForTimeout(300);
        
        // Take screenshot with transparent background
        await page.screenshot({
            path: pngPath,
            type: 'png',
            fullPage: true,
            omitBackground: true // Transparent background
        });
        
        // Crop to visible pixels only (remove transparent space)
        if (await cropPNGToVisible(pngPath)) {
            console.log('   Cropped PNG to visible pixels');
        }
        
    } catch (error) {
        throw new Error(`Failed to export PNG: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Main function
// Options: { palette: 'reds' | 'purples' | 'alternating' | null, exportPng: boolean }
async function build(inputPath, outputPath, options = {}) {
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
    
    // Apply palette preset if specified via CLI
    if (options.palette) {
        const presetPalette = getPaletteByName(options.palette);
        if (presetPalette) {
            config.palette = presetPalette;
            config.palettePreset = options.palette.toLowerCase(); // Store preset name for template
            console.log(`✓ Applied "${options.palette}" palette preset`);
            
            // Set accent styles based on palette variant
            const paletteName = options.palette.toLowerCase();
            
            // reds_b: Purple left border accent
            if (paletteName === 'reds_b') {
                config.accentBorder = BRAND.PURPLE_4; // Dark purple border accent
            }
            // purples_a: Burgundy task name text only
            else if (paletteName === 'purples_a') {
                config.accentColor = BRAND.RED_3; // Burgundy text
            }
            // purples_b: Left border accent only (keep black text)
            else if (paletteName === 'purples_b') {
                config.accentBorder = BRAND.RED_2; // Red border accent
            }
            // purples_c: Both burgundy text AND left border
            else if (paletteName === 'purples_c') {
                config.accentColor = BRAND.RED_3; // Burgundy text
                config.accentBorder = BRAND.RED_2; // Red border accent
            }
            // alternating_b: Alternating colors with red left border accent
            else if (paletteName === 'alternating_b') {
                config.accentBorder = BRAND.RED_2; // Red border accent
            }
            
            // Re-assign colors to tasks based on new palette
            if (config.tasks && Array.isArray(config.tasks)) {
                config.tasks.forEach((task, idx) => {
                    // Use colorIndex if defined, otherwise use task index
                    const colorIdx = task.colorIndex !== undefined ? task.colorIndex : idx;
                    task.color = config.palette[colorIdx % config.palette.length];
                });
            }
        }
    }
    
    // Validate
    console.log('✓ Validating configuration...');
    validateConfig(config);
    console.log('✓ Validation passed');
    
    // Generate HTML
    const templatePath = path.join(__dirname, '..', 'templates', 'gantt_template.html');
    const paletteSuffix = options.palette ? `_${options.palette.toLowerCase()}` : '';
    const htmlOutputPath = outputPath || (() => {
        const inputBasename = path.basename(inputPath, path.extname(inputPath));
        return path.join(__dirname, '..', 'output', `${inputBasename}_gantt_chart${paletteSuffix}.html`);
    })();
    
    console.log('✓ Generating HTML...');
    generateHTML(config, templatePath, htmlOutputPath);
    console.log(`✓ Generated HTML at ${htmlOutputPath}`);
    
    // Generate PNG export with transparent background (if requested and Playwright is available)
    const shouldExportPng = options.exportPng !== false; // Default to true for CLI backwards compatibility
    if (shouldExportPng && playwright) {
        const pngOutputPath = htmlOutputPath.replace(/\.html$/, '.png');
        console.log('✓ Exporting PNG...');
        try {
            await exportPNG(htmlOutputPath, pngOutputPath);
            console.log(`✓ Generated PNG at ${pngOutputPath}`);
        } catch (error) {
            console.warn(`⚠️  PNG export failed: ${error.message}`);
            console.warn('   (HTML file was generated successfully)');
        }
    } else if (shouldExportPng && !playwright) {
        console.log('ℹ️  Skipping PNG export (Playwright not installed)');
        console.log('   Install with: npm install @playwright/test');
        console.log('   Will use system Chrome/Edge if available, or download Chromium');
    } else {
        console.log('ℹ️  PNG export not requested');
    }
    
    // Optionally save JSON config
    // In CLI/dev this writes to ./config/project.json; in bundled apps the
    // Resources directory may be read-only, so treat failures as non-fatal.
    try {
        const configDir = path.join(__dirname, '..', 'config');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        const jsonOutputPath = path.join(configDir, 'project.json');
        fs.writeFileSync(jsonOutputPath, JSON.stringify(config, null, 2), 'utf8');
        console.log(`✓ Saved config to ${jsonOutputPath}`);
    } catch (error) {
        console.warn(`ℹ️  Skipping config save (non-fatal): ${error.message}`);
    }
    
    console.log(`\n  To preview: open ${htmlOutputPath} in a browser`);
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const inputIndex = args.indexOf('--input') !== -1 ? args.indexOf('--input') : args.indexOf('-i');
    const outputIndex = args.indexOf('--output') !== -1 ? args.indexOf('--output') : args.indexOf('-o');
    const paletteIndex = args.indexOf('--palette') !== -1 ? args.indexOf('--palette') : args.indexOf('-p');
    const pngFlag = args.includes('--png');
    const noPngFlag = args.includes('--no-png');
    
    if (inputIndex === -1 || !args[inputIndex + 1]) {
        console.error('Usage: node scripts/build.js --input <file.json|file.xlsx> [options]');
        console.error('');
        console.error('Options:');
        console.error('  --input, -i     Input file (JSON or XLSX) [required]');
        console.error('  --output, -o    Output HTML file (defaults to output/<inputname>_gantt_chart.html)');
        console.error('  --palette, -p   Color palette preset: reds, purples, alternating');
        console.error('  --png           Export PNG image (default for CLI)');
        console.error('  --no-png        Skip PNG export');
        console.error('');
        console.error('Palette presets:');
        console.error('  reds          Red gradient (RED 1 → RED 5) - warm, attention-grabbing');
        console.error('  purples_a     Purple gradient + burgundy task name text');
        console.error('  purples_b     Purple gradient + red left border accent');
        console.error('  purples_c     Purple gradient + both burgundy text AND border');
        console.error('  alternating   Alternating red/purple - maximum visual distinction [default]');
        console.error('  alternating_b Alternating red/purple + red left border accent');
        process.exit(1);
    }
    
    const inputPath = path.resolve(args[inputIndex + 1]);
    const outputPath = outputIndex !== -1 && args[outputIndex + 1] 
        ? path.resolve(args[outputIndex + 1])
        : null;
    const palette = paletteIndex !== -1 && args[paletteIndex + 1]
        ? args[paletteIndex + 1]
        : null;
    // Default to true for CLI (backwards compatible), but respect --no-png flag
    const exportPng = noPngFlag ? false : true;
    
    build(inputPath, outputPath, { palette, exportPng }).catch(error => {
        console.error('✗ Error:', error.message);
        process.exit(1);
    });
}

module.exports = { 
    build, 
    parseExcel, 
    parseJSON, 
    validateConfig,
    PALETTE_PRESETS, 
    getPaletteByName,
    assignTaskColors,
    collectSubtasks,
    BRAND_COLORS
};

