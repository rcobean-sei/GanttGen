// GanttGen Desktop App - Frontend Logic

// Tauri API imports (available via withGlobalTauri)
const { invoke } = window.__TAURI__.core;
const { open, save } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
const { open: shellOpen } = window.__TAURI__.shell;
const { dirname } = window.__TAURI__.path;

// State
let state = {
    inputFile: null,
    selectedPalette: 'alternating',
    outputDir: null,
    isGenerating: false,
    lastResult: null
};

// DOM Elements
const elements = {
    dropZone: document.getElementById('dropZone'),
    browseBtn: document.getElementById('browseBtn'),
    selectedFile: document.getElementById('selectedFile'),
    fileName: document.getElementById('fileName'),
    clearFileBtn: document.getElementById('clearFileBtn'),
    paletteGrid: document.getElementById('paletteGrid'),
    exportHtml: document.getElementById('exportHtml'),
    exportPng: document.getElementById('exportPng'),
    outputDir: document.getElementById('outputDir'),
    selectOutputBtn: document.getElementById('selectOutputBtn'),
    generateBtn: document.getElementById('generateBtn'),
    progressSection: document.getElementById('progressSection'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    resultSection: document.getElementById('resultSection'),
    resultSuccess: document.getElementById('resultSuccess'),
    resultError: document.getElementById('resultError'),
    resultFiles: document.getElementById('resultFiles'),
    errorMessage: document.getElementById('errorMessage'),
    openOutputBtn: document.getElementById('openOutputBtn'),
    viewHtmlBtn: document.getElementById('viewHtmlBtn'),
    tryAgainBtn: document.getElementById('tryAgainBtn')
};

// Initialize the app
async function init() {
    await loadPalettes();
    setupEventListeners();
    setupDragAndDrop();
    await setupProgressListener();
    updateGenerateButton();
}

// Load palette options from backend
async function loadPalettes() {
    try {
        const palettes = await invoke('get_palette_info');
        renderPalettes(palettes);
    } catch (error) {
        console.error('Failed to load palettes:', error);
        // Fallback to hardcoded palettes
        renderPalettes(getDefaultPalettes());
    }
}

function getDefaultPalettes() {
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
}

function renderPalettes(palettes) {
    elements.paletteGrid.innerHTML = palettes.map(palette => `
        <div class="palette-option ${palette.id === state.selectedPalette ? 'selected' : ''}"
             data-palette="${palette.id}">
            <div class="palette-header">
                <span class="palette-name">${palette.name}</span>
                <span class="palette-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </span>
            </div>
            <p class="palette-description">${palette.description}</p>
            <div class="palette-colors">
                ${palette.colors.map(color =>
                    `<div class="palette-color" style="background-color: ${color};"></div>`
                ).join('')}
            </div>
            ${(palette.accent_border || palette.accent_color) ? `
                <div class="palette-accents">
                    ${palette.accent_border ? `
                        <span class="accent-tag">
                            <span class="accent-swatch" style="background-color: ${palette.accent_border};"></span>
                            Border
                        </span>
                    ` : ''}
                    ${palette.accent_color ? `
                        <span class="accent-tag">
                            <span class="accent-swatch" style="background-color: ${palette.accent_color};"></span>
                            Text
                        </span>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `).join('');

    // Add click handlers to palette options
    document.querySelectorAll('.palette-option').forEach(option => {
        option.addEventListener('click', () => selectPalette(option.dataset.palette));
    });
}

function selectPalette(paletteId) {
    state.selectedPalette = paletteId;
    document.querySelectorAll('.palette-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.palette === paletteId);
    });
}

function setupEventListeners() {
    // Browse button
    elements.browseBtn.addEventListener('click', openFileDialog);

    // Clear file button
    elements.clearFileBtn.addEventListener('click', clearFile);

    // Select output directory
    elements.selectOutputBtn.addEventListener('click', selectOutputDirectory);

    // Generate button
    elements.generateBtn.addEventListener('click', generateGantt);

    // Result actions
    elements.openOutputBtn.addEventListener('click', openOutputFolder);
    elements.viewHtmlBtn.addEventListener('click', viewHtmlFile);
    elements.tryAgainBtn.addEventListener('click', resetResults);
}

function setupDragAndDrop() {
    const dropZone = elements.dropZone;

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            // Get the file path (Tauri provides this)
            if (file.path) {
                await handleFileSelection(file.path);
            }
        }
    });

    // Click to browse
    dropZone.addEventListener('click', (e) => {
        if (e.target !== elements.browseBtn) {
            openFileDialog();
        }
    });
}

async function setupProgressListener() {
    await listen('generation-progress', (event) => {
        const { step, progress } = event.payload;
        updateProgress(progress, step);
    });
}

async function openFileDialog() {
    try {
        const selected = await open({
            multiple: false,
            filters: [{
                name: 'GanttGen Input',
                extensions: ['json', 'xlsx']
            }]
        });

        if (selected) {
            await handleFileSelection(selected);
        }
    } catch (error) {
        console.error('File dialog error:', error);
    }
}

async function handleFileSelection(filePath) {
    try {
        // Validate the file
        await invoke('validate_input_file', { path: filePath });

        state.inputFile = filePath;

        // Extract filename from path
        const fileName = filePath.split(/[\\/]/).pop();
        elements.fileName.textContent = fileName;

        // Show selected file UI
        elements.selectedFile.style.display = 'flex';
        elements.dropZone.style.display = 'none';

        // Auto-set output directory to same location as input
        if (!state.outputDir) {
            try {
                const dir = await dirname(filePath);
                state.outputDir = dir;
                elements.outputDir.value = dir;
            } catch (e) {
                console.error('Could not get directory:', e);
            }
        }

        updateGenerateButton();
    } catch (error) {
        alert(`Invalid file: ${error}`);
    }
}

function clearFile() {
    state.inputFile = null;
    elements.selectedFile.style.display = 'none';
    elements.dropZone.style.display = 'block';
    updateGenerateButton();
}

async function selectOutputDirectory() {
    try {
        const selected = await open({
            directory: true,
            multiple: false
        });

        if (selected) {
            state.outputDir = selected;
            elements.outputDir.value = selected;
        }
    } catch (error) {
        console.error('Directory dialog error:', error);
    }
}

function updateGenerateButton() {
    const canGenerate = state.inputFile && !state.isGenerating;
    elements.generateBtn.disabled = !canGenerate;
}

function updateProgress(percent, text) {
    elements.progressBar.style.width = `${percent}%`;
    elements.progressText.textContent = text;
}

async function generateGantt() {
    if (!state.inputFile || state.isGenerating) return;

    state.isGenerating = true;
    updateGenerateButton();

    // Hide previous results
    elements.resultSection.style.display = 'none';
    elements.resultSuccess.style.display = 'none';
    elements.resultError.style.display = 'none';

    // Show progress
    elements.progressSection.style.display = 'block';
    updateProgress(0, 'Initializing...');

    try {
        const options = {
            input_path: state.inputFile,
            output_path: state.outputDir ? `${state.outputDir}/output_gantt_chart.html` : null,
            palette: state.selectedPalette,
            export_png: elements.exportPng.checked
        };

        const result = await invoke('generate_gantt', { options });

        state.lastResult = result;
        showSuccess(result);
    } catch (error) {
        showError(error);
    } finally {
        state.isGenerating = false;
        updateGenerateButton();
        elements.progressSection.style.display = 'none';
    }
}

function showSuccess(result) {
    elements.resultSection.style.display = 'block';
    elements.resultSuccess.style.display = 'block';
    elements.resultError.style.display = 'none';

    // Build file list
    let filesHtml = '';
    if (result.html_path) {
        filesHtml += `
            <div class="result-file">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>${result.html_path}</span>
            </div>
        `;
    }
    if (result.png_path) {
        filesHtml += `
            <div class="result-file">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>${result.png_path}</span>
            </div>
        `;
    }

    elements.resultFiles.innerHTML = filesHtml || '<p>Files generated successfully!</p>';

    // Show/hide view HTML button based on whether HTML was generated
    elements.viewHtmlBtn.style.display = result.html_path ? 'inline-flex' : 'none';
}

function showError(error) {
    elements.resultSection.style.display = 'block';
    elements.resultSuccess.style.display = 'none';
    elements.resultError.style.display = 'block';
    elements.errorMessage.textContent = typeof error === 'string' ? error : error.message || 'Unknown error';
}

function resetResults() {
    elements.resultSection.style.display = 'none';
    elements.resultSuccess.style.display = 'none';
    elements.resultError.style.display = 'none';
}

async function openOutputFolder() {
    if (state.outputDir) {
        try {
            await shellOpen(state.outputDir);
        } catch (error) {
            console.error('Failed to open folder:', error);
        }
    } else if (state.lastResult?.html_path) {
        try {
            const dir = await dirname(state.lastResult.html_path);
            await shellOpen(dir);
        } catch (error) {
            console.error('Failed to open folder:', error);
        }
    }
}

async function viewHtmlFile() {
    if (state.lastResult?.html_path) {
        try {
            await shellOpen(state.lastResult.html_path);
        } catch (error) {
            console.error('Failed to open HTML file:', error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Also try to init immediately if Tauri is already available
if (window.__TAURI__) {
    init();
}
