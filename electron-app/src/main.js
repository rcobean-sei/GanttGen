// GanttGen Electron - Main Process
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#FFFFF8',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'default',
        icon: getIconPath()
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function getIconPath() {
    const iconsDir = path.join(__dirname, '..', 'build');

    if (process.platform === 'win32') {
        return path.join(iconsDir, 'icon.ico');
    } else if (process.platform === 'darwin') {
        return path.join(iconsDir, 'icon.icns');
    } else {
        return path.join(iconsDir, 'icon.png');
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers

// Get palette information
ipcMain.handle('get-palette-info', () => {
    return [
        {
            id: 'alternating',
            name: 'Alternating (Default)',
            description: 'Best task differentiation with red/purple mix',
            colors: ['#F01840', '#402848', '#C01830', '#705E74', '#901226'],
            accent_border: null,
            accent_color: null
        },
        {
            id: 'alternating_b',
            name: 'Alternating + Border',
            description: 'Alternating with red left border accent',
            colors: ['#F01840', '#402848', '#C01830', '#705E74', '#901226'],
            accent_border: '#C01830',
            accent_color: null
        },
        {
            id: 'reds',
            name: 'Reds',
            description: 'Warm, energetic red gradient',
            colors: ['#F01840', '#C01830', '#901226', '#600C1C', '#300810'],
            accent_border: null,
            accent_color: null
        },
        {
            id: 'reds_b',
            name: 'Reds + Purple Border',
            description: 'Red gradient with purple left border',
            colors: ['#F01840', '#C01830', '#901226', '#600C1C', '#300810'],
            accent_border: '#402848',
            accent_color: null
        },
        {
            id: 'purples_a',
            name: 'Purples + Burgundy Text',
            description: 'Purple gradient with burgundy task names',
            colors: ['#705E74', '#402848', '#2A1C30'],
            accent_border: null,
            accent_color: '#901226'
        },
        {
            id: 'purples_b',
            name: 'Purples + Red Border',
            description: 'Purple gradient with red left border',
            colors: ['#705E74', '#402848', '#2A1C30'],
            accent_border: '#C01830',
            accent_color: null
        },
        {
            id: 'purples_c',
            name: 'Purples + Both Accents',
            description: 'Purple with burgundy text and red border',
            colors: ['#705E74', '#402848', '#2A1C30'],
            accent_border: '#C01830',
            accent_color: '#901226'
        }
    ];
});

// Validate input file
ipcMain.handle('validate-input-file', async (event, filePath) => {
    if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist');
    }

    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.json' && ext !== '.xlsx') {
        throw new Error('Invalid file type. Only .json and .xlsx files are supported.');
    }

    return true;
});

// Open file dialog
ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'GanttGen Input', extensions: ['json', 'xlsx'] }
        ]
    });

    return result.canceled ? null : result.filePaths[0];
});

// Open directory dialog
ipcMain.handle('open-directory-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    return result.canceled ? null : result.filePaths[0];
});

// Generate Gantt chart
ipcMain.handle('generate-gantt', async (event, options) => {
    return new Promise((resolve, reject) => {
        // Determine script path (handle both development and packaged app)
        let scriptPath;
        if (app.isPackaged) {
            // In packaged app, scripts are in resources
            scriptPath = path.join(process.resourcesPath, 'scripts', 'build.js');
        } else {
            // In development, scripts are in parent directory
            scriptPath = path.join(__dirname, '..', '..', 'scripts', 'build.js');
        }

        // Build command arguments
        const args = ['--input', options.input_path];

        if (options.palette) {
            args.push('--palette', options.palette);
        }

        if (options.export_png) {
            args.push('--export-png');
        }

        // Set output directory if specified
        let outputDir = options.output_path ? path.dirname(options.output_path) : path.dirname(options.input_path);

        // Set up NODE_PATH to find dependencies
        let nodePath = process.env.NODE_PATH || '';
        if (app.isPackaged) {
            // In packaged app, add resources node_modules to NODE_PATH
            const resourcesNodeModules = path.join(process.resourcesPath, 'node_modules');
            nodePath = nodePath ? `${resourcesNodeModules}${path.delimiter}${nodePath}` : resourcesNodeModules;
        }

        // Execute the build script
        const nodeProcess = spawn('node', [scriptPath, ...args], {
            cwd: path.dirname(scriptPath),
            env: {
                ...process.env,
                OUTPUT_DIR: outputDir,
                NODE_PATH: nodePath
            }
        });

        let stdout = '';
        let stderr = '';

        nodeProcess.stdout.on('data', (data) => {
            const output = data.toString();
            stdout += output;

            // Parse progress updates
            const lines = output.split('\n');
            lines.forEach(line => {
                if (line.includes('Validating')) {
                    event.sender.send('generation-progress', { progress: 10, step: 'Validating input...' });
                } else if (line.includes('Generating HTML')) {
                    event.sender.send('generation-progress', { progress: 40, step: 'Generating HTML...' });
                } else if (line.includes('Exporting PNG')) {
                    event.sender.send('generation-progress', { progress: 70, step: 'Exporting PNG...' });
                } else if (line.includes('Complete')) {
                    event.sender.send('generation-progress', { progress: 100, step: 'Complete!' });
                }
            });
        });

        nodeProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        nodeProcess.on('close', (code) => {
            if (code === 0) {
                // Parse output to find generated file paths
                const htmlMatch = stdout.match(/HTML: (.+\.html)/);
                const pngMatch = stdout.match(/PNG: (.+\.png)/);

                // If no explicit paths in output, construct them
                const inputBasename = path.basename(options.input_path, path.extname(options.input_path));
                const htmlPath = htmlMatch ? htmlMatch[1] : path.join(outputDir, `${inputBasename}_gantt_chart_${options.palette}.html`);
                const pngPath = options.export_png ? (pngMatch ? pngMatch[1] : path.join(outputDir, `${inputBasename}_gantt_chart_${options.palette}.png`)) : null;

                resolve({
                    html_path: htmlPath,
                    png_path: pngPath,
                    stdout: stdout
                });
            } else {
                reject(new Error(stderr || `Build process exited with code ${code}`));
            }
        });

        nodeProcess.on('error', (error) => {
            reject(error);
        });
    });
});

// Open file or folder in system default app
ipcMain.handle('shell-open', async (event, filePath) => {
    const { shell } = require('electron');
    return shell.openPath(filePath);
});

// Get directory name from path
ipcMain.handle('get-dirname', async (event, filePath) => {
    return path.dirname(filePath);
});
