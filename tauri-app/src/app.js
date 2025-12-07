// GanttGen Desktop App - Frontend Logic (Tauri Edition)

// Tauri API imports (available via withGlobalTauri)
const { invoke } = window.__TAURI__.core;
const { open, save } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
const { open: shellOpen } = window.__TAURI__.shell;
const { dirname } = window.__TAURI__.path;

// State
let state = {
    inputMethod: 'file', // 'file' or 'manual'
    inputFile: null,
    manualData: {
        tasks: [],
        pausePeriods: []
    },
    selectedPalette: 'alternating',
    outputDir: null,
    isGenerating: false,
    lastResult: null,
    taskIdCounter: 0,
    pauseIdCounter: 0
};

// DOM Elements
const elements = {
    // Input method tabs
    fileMethodBtn: document.getElementById('fileMethodBtn'),
    manualMethodBtn: document.getElementById('manualMethodBtn'),
    filePanel: document.getElementById('filePanel'),
    manualPanel: document.getElementById('manualPanel'),

    // File upload elements
    dropZone: document.getElementById('dropZone'),
    browseBtn: document.getElementById('browseBtn'),
    selectedFile: document.getElementById('selectedFile'),
    fileName: document.getElementById('fileName'),
    clearFileBtn: document.getElementById('clearFileBtn'),

    // Manual entry elements
    projectTitle: document.getElementById('projectTitle'),
    timelineStart: document.getElementById('timelineStart'),
    timelineEnd: document.getElementById('timelineEnd'),
    showMilestones: document.getElementById('showMilestones'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    tasksList: document.getElementById('tasksList'),
    addPauseBtn: document.getElementById('addPauseBtn'),
    pausePeriodsList: document.getElementById('pausePeriodsList'),
    pauseCount: document.getElementById('pauseCount'),

    // Common elements
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

    // Check for test mode and populate form
    try {
        const testMode = await invoke('is_test_mode');
        if (testMode) {
            console.log('Test mode enabled, loading test data...');
            await loadTestData();
        }
    } catch (error) {
        console.log('Test mode not available or disabled:', error);
    }
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
    // Input method tabs
    elements.fileMethodBtn.addEventListener('click', () => switchInputMethod('file'));
    elements.manualMethodBtn.addEventListener('click', () => switchInputMethod('manual'));

    // Browse button
    elements.browseBtn.addEventListener('click', openFileDialog);

    // Clear file button
    elements.clearFileBtn.addEventListener('click', clearFile);

    // Manual entry buttons
    elements.addTaskBtn.addEventListener('click', addTask);
    elements.addPauseBtn.addEventListener('click', addPausePeriod);

    // Collapsible sections
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('expanded');
        });
    });

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
    let canGenerate = false;

    if (state.inputMethod === 'file') {
        canGenerate = state.inputFile && !state.isGenerating;
    } else if (state.inputMethod === 'manual') {
        // Check if minimum required fields are filled
        canGenerate = !state.isGenerating &&
                     elements.projectTitle?.value &&
                     elements.timelineStart?.value &&
                     elements.timelineEnd?.value &&
                     state.manualData.tasks.length > 0;
    }

    elements.generateBtn.disabled = !canGenerate;
}

function updateProgress(percent, text) {
    elements.progressBar.style.width = `${percent}%`;
    elements.progressText.textContent = text;
}

async function generateGantt() {
    if (state.isGenerating) return;

    // Validate input
    if (state.inputMethod === 'file' && !state.inputFile) return;
    if (state.inputMethod === 'manual') {
        if (!elements.projectTitle?.value || !elements.timelineStart?.value ||
            !elements.timelineEnd?.value || state.manualData.tasks.length === 0) {
            alert('Please fill in all required fields and add at least one task.');
            return;
        }
    }

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
        let inputPath;

        // For manual entry, create a temporary JSON file
        if (state.inputMethod === 'manual') {
            const manualData = collectManualData();
            console.log('Manual data collected:', manualData);
            inputPath = await invoke('create_temp_json', { data: manualData });
            console.log('Temp file created:', inputPath);

            // Set default output directory to same location as temp file if not set
            if (!state.outputDir) {
                state.outputDir = await dirname(inputPath);
            }
        } else {
            inputPath = state.inputFile;
        }

        const options = {
            input_path: inputPath,
            output_path: state.outputDir ? `${state.outputDir}/output_gantt_chart.html` : null,
            palette: state.selectedPalette,
            export_png: elements.exportPng.checked
        };

        console.log('Generate options:', options);
        const result = await invoke('generate_gantt', { options });
        console.log('Generate result:', result);

        state.lastResult = result;
        showSuccess(result);
    } catch (error) {
        console.error('Generation error:', error);
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

// ========================================
// Manual Entry Functions
// ========================================

function switchInputMethod(method) {
    state.inputMethod = method;

    // Update tab buttons
    elements.fileMethodBtn.classList.toggle('active', method === 'file');
    elements.manualMethodBtn.classList.toggle('active', method === 'manual');

    // Update panels
    elements.filePanel.classList.toggle('active', method === 'file');
    elements.manualPanel.classList.toggle('active', method === 'manual');

    // Update generate button
    updateGenerateButton();
}

function addTask() {
    const taskId = state.taskIdCounter++;
    const taskIndex = state.manualData.tasks.length;

    const task = {
        id: taskId,
        name: '',
        start: '',
        end: '',
        hours: 0,
        subtasks: [],
        milestones: []
    };

    state.manualData.tasks.push(task);
    renderTask(task, taskIndex);
    updateGenerateButton();
}

function renderTask(task, index) {
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.dataset.taskId = task.id;

    taskCard.innerHTML = `
        <div class="task-card-header">
            <span class="task-number">${index + 1}</span>
            <div class="task-actions">
                <button type="button" class="btn-icon" onclick="removeTask(${task.id})" title="Remove task">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>

        <div class="task-fields">
            <div class="form-group">
                <label>Task/Phase Name *</label>
                <input type="text" class="task-name" placeholder="e.g., Phase 1: Discovery"
                       onchange="updateTaskField(${task.id}, 'name', this.value)" required>
            </div>

            <div class="task-dates">
                <div class="form-group">
                    <label>Start Date *</label>
                    <input type="date" class="task-start"
                           onchange="updateTaskField(${task.id}, 'start', this.value)" required>
                </div>
                <div class="form-group">
                    <label>End Date *</label>
                    <input type="date" class="task-end"
                           onchange="updateTaskField(${task.id}, 'end', this.value)" required>
                </div>
                <div class="form-group">
                    <label>Hours (Optional)</label>
                    <input type="number" class="task-hours" placeholder="0" min="0"
                           onchange="updateTaskField(${task.id}, 'hours', parseInt(this.value) || 0)">
                </div>
            </div>

            <!-- Subtasks Section -->
            <div class="subtasks-section">
                <div class="subtasks-header">
                    <h4>Subtasks</h4>
                    <button type="button" class="btn btn-small btn-secondary" onclick="addSubtask(${task.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Subtask
                    </button>
                </div>
                <div class="subtasks-list" id="subtasks-${task.id}">
                    <!-- Subtasks will be added here -->
                </div>
            </div>

            <!-- Milestones Section -->
            <div class="milestones-section">
                <div class="subtasks-header">
                    <h4>Milestones (Optional)</h4>
                    <button type="button" class="btn btn-small btn-secondary" onclick="addMilestone(${task.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Milestone
                    </button>
                </div>
                <div class="milestones-list" id="milestones-${task.id}">
                    <!-- Milestones will be added here -->
                </div>
            </div>
        </div>
    `;

    elements.tasksList.appendChild(taskCard);
}

function removeTask(taskId) {
    const taskIndex = state.manualData.tasks.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
        state.manualData.tasks.splice(taskIndex, 1);
        document.querySelector(`[data-task-id="${taskId}"]`)?.remove();

        // Renumber tasks
        document.querySelectorAll('.task-number').forEach((num, idx) => {
            num.textContent = idx + 1;
        });

        updateGenerateButton();
    }
}

function updateTaskField(taskId, field, value) {
    const task = state.manualData.tasks.find(t => t.id === taskId);
    if (task) {
        task[field] = value;
        updateGenerateButton();
    }
}

function addSubtask(taskId) {
    const task = state.manualData.tasks.find(t => t.id === taskId);
    if (!task) return;

    const subtaskIndex = task.subtasks.length;
    task.subtasks.push('');

    const subtasksList = document.getElementById(`subtasks-${taskId}`);
    const subtaskItem = document.createElement('div');
    subtaskItem.className = 'subtask-item';
    subtaskItem.innerHTML = `
        <input type="text" placeholder="Subtask description"
               onchange="updateSubtask(${taskId}, ${subtaskIndex}, this.value)">
        <button type="button" class="btn-icon btn-icon-only" onclick="removeSubtask(${taskId}, ${subtaskIndex})" title="Remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    subtasksList.appendChild(subtaskItem);
}

function updateSubtask(taskId, subtaskIndex, value) {
    const task = state.manualData.tasks.find(t => t.id === taskId);
    if (task) {
        task.subtasks[subtaskIndex] = value;
    }
}

function removeSubtask(taskId, subtaskIndex) {
    const task = state.manualData.tasks.find(t => t.id === taskId);
    if (task) {
        task.subtasks.splice(subtaskIndex, 1);
        const subtasksList = document.getElementById(`subtasks-${taskId}`);
        subtasksList.children[subtaskIndex]?.remove();
    }
}

function addMilestone(taskId) {
    const task = state.manualData.tasks.find(t => t.id === taskId);
    if (!task) return;

    const milestoneIndex = task.milestones.length;
    task.milestones.push({ name: '', date: '' });

    const milestonesList = document.getElementById(`milestones-${taskId}`);
    const milestoneItem = document.createElement('div');
    milestoneItem.className = 'milestone-item';
    milestoneItem.innerHTML = `
        <input type="text" placeholder="Milestone name"
               onchange="updateMilestone(${taskId}, ${milestoneIndex}, 'name', this.value)">
        <input type="date"
               onchange="updateMilestone(${taskId}, ${milestoneIndex}, 'date', this.value)">
        <button type="button" class="btn-icon btn-icon-only" onclick="removeMilestone(${taskId}, ${milestoneIndex})" title="Remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    milestonesList.appendChild(milestoneItem);
}

function updateMilestone(taskId, milestoneIndex, field, value) {
    const task = state.manualData.tasks.find(t => t.id === taskId);
    if (task && task.milestones[milestoneIndex]) {
        task.milestones[milestoneIndex][field] = value;
    }
}

function removeMilestone(taskId, milestoneIndex) {
    const task = state.manualData.tasks.find(t => t.id === taskId);
    if (task) {
        task.milestones.splice(milestoneIndex, 1);
        const milestonesList = document.getElementById(`milestones-${taskId}`);
        milestonesList.children[milestoneIndex]?.remove();
    }
}

function addPausePeriod() {
    const pauseId = state.pauseIdCounter++;
    const pause = { id: pauseId, start: '', end: '' };

    state.manualData.pausePeriods.push(pause);
    renderPausePeriod(pause);
    updatePauseCount();
}

function renderPausePeriod(pause) {
    const pauseItem = document.createElement('div');
    pauseItem.className = 'pause-item';
    pauseItem.dataset.pauseId = pause.id;
    pauseItem.innerHTML = `
        <div class="form-group" style="flex: 1; margin: 0;">
            <input type="date" placeholder="Start date"
                   onchange="updatePausePeriod(${pause.id}, 'start', this.value)">
        </div>
        <div class="form-group" style="flex: 1; margin: 0;">
            <input type="date" placeholder="End date"
                   onchange="updatePausePeriod(${pause.id}, 'end', this.value)">
        </div>
        <button type="button" class="btn-icon btn-icon-only" onclick="removePausePeriod(${pause.id})" title="Remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    elements.pausePeriodsList.appendChild(pauseItem);
}

function updatePausePeriod(pauseId, field, value) {
    const pause = state.manualData.pausePeriods.find(p => p.id === pauseId);
    if (pause) {
        pause[field] = value;
    }
}

function removePausePeriod(pauseId) {
    const pauseIndex = state.manualData.pausePeriods.findIndex(p => p.id === pauseId);
    if (pauseIndex >= 0) {
        state.manualData.pausePeriods.splice(pauseIndex, 1);
        document.querySelector(`[data-pause-id="${pauseId}"]`)?.remove();
        updatePauseCount();
    }
}

function updatePauseCount() {
    if (elements.pauseCount) {
        elements.pauseCount.textContent = state.manualData.pausePeriods.length;
    }
}

function collectManualData() {
    // Get the selected palette colors
    const paletteInfo = getDefaultPalettes().find(p => p.id === state.selectedPalette);

    const data = {
        title: elements.projectTitle.value,
        timelineStart: elements.timelineStart.value,
        timelineEnd: elements.timelineEnd.value,
        showMilestones: elements.showMilestones.checked,
        palette: paletteInfo?.colors || [],
        palettePreset: state.selectedPalette,
        tasks: [],
        milestones: [],
        pausePeriods: []
    };

    // Process tasks
    state.manualData.tasks.forEach((task, taskIndex) => {
        if (task.name && task.start && task.end) {
            const taskData = {
                name: task.name,
                start: task.start,
                end: task.end,
                hours: task.hours || 0,
                subtasks: task.subtasks.filter(s => s.trim()),
                colorIndex: taskIndex
            };
            data.tasks.push(taskData);

            // Process milestones for this task
            task.milestones.forEach(milestone => {
                if (milestone.name && milestone.date) {
                    data.milestones.push({
                        name: milestone.name,
                        date: milestone.date,
                        taskIndex: taskIndex
                    });
                }
            });
        }
    });

    // Process pause periods
    data.pausePeriods = state.manualData.pausePeriods
        .filter(p => p.start && p.end)
        .map(p => ({ start: p.start, end: p.end }));

    return data;
}

// Load test data and populate form
async function loadTestData() {
    try {
        const testData = await invoke('get_test_data');
        if (!testData) {
            console.error('No test data available');
            return;
        }

        console.log('Loading test data:', testData);

        // Switch to manual entry tab
        switchInputMethod('manual');

        // Populate basic fields
        elements.projectTitle.value = testData.title || 'Test Project';
        elements.timelineStart.value = testData.timelineStart || '';
        elements.timelineEnd.value = testData.timelineEnd || '';
        elements.showMilestones.checked = testData.showMilestones !== false;

        // Select the matching palette
        if (testData.palettePreset) {
            selectPalette(testData.palettePreset);
        }

        // Add tasks
        if (testData.tasks && testData.tasks.length > 0) {
            testData.tasks.forEach((taskData, index) => {
                addTask();
                const task = state.manualData.tasks[index];

                // Update task fields
                task.name = taskData.name;
                task.start = taskData.start;
                task.end = taskData.end;
                task.hours = taskData.hours || 0;

                // Populate the DOM elements
                const taskCard = document.querySelector(`[data-task-id="${task.id}"]`);
                if (taskCard) {
                    taskCard.querySelector('.task-name').value = task.name;
                    taskCard.querySelector('.task-start').value = task.start;
                    taskCard.querySelector('.task-end').value = task.end;
                    taskCard.querySelector('.task-hours').value = task.hours;

                    // Add subtasks
                    if (taskData.subtasks && taskData.subtasks.length > 0) {
                        taskData.subtasks.forEach((subtaskText, subtaskIdx) => {
                            addSubtask(task.id);
                            task.subtasks[subtaskIdx] = subtaskText;
                            const subtaskInput = taskCard.querySelector(`#subtasks-${task.id}`).children[subtaskIdx]?.querySelector('input');
                            if (subtaskInput) {
                                subtaskInput.value = subtaskText;
                            }
                        });
                    }

                    // Add milestones for this task
                    const taskMilestones = testData.milestones?.filter(m => m.taskIndex === index) || [];
                    taskMilestones.forEach((milestoneData, milestoneIdx) => {
                        addMilestone(task.id);
                        task.milestones[milestoneIdx] = {
                            name: milestoneData.name,
                            date: milestoneData.date
                        };
                        const milestoneItem = taskCard.querySelector(`#milestones-${task.id}`).children[milestoneIdx];
                        if (milestoneItem) {
                            const inputs = milestoneItem.querySelectorAll('input');
                            inputs[0].value = milestoneData.name;
                            inputs[1].value = milestoneData.date;
                        }
                    });
                }
            });
        }

        // Add pause periods
        if (testData.pausePeriods && testData.pausePeriods.length > 0) {
            // Expand the pause periods section
            document.querySelector('.pause-periods-section')?.classList.add('expanded');

            testData.pausePeriods.forEach((pauseData, index) => {
                addPausePeriod();
                const pause = state.manualData.pausePeriods[index];
                pause.start = pauseData.start;
                pause.end = pauseData.end;

                const pauseItem = document.querySelector(`[data-pause-id="${pause.id}"]`);
                if (pauseItem) {
                    const inputs = pauseItem.querySelectorAll('input[type="date"]');
                    inputs[0].value = pauseData.start;
                    inputs[1].value = pauseData.end;
                }
            });
        }

        updateGenerateButton();
        console.log('Test data loaded successfully');
    } catch (error) {
        console.error('Failed to load test data:', error);
    }
}

// Make functions globally available for onclick handlers
window.removeTask = removeTask;
window.updateTaskField = updateTaskField;
window.addSubtask = addSubtask;
window.updateSubtask = updateSubtask;
window.removeSubtask = removeSubtask;
window.addMilestone = addMilestone;
window.updateMilestone = updateMilestone;
window.removeMilestone = removeMilestone;
window.updatePausePeriod = updatePausePeriod;
window.removePausePeriod = removePausePeriod;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Also try to init immediately if Tauri is already available
if (window.__TAURI__) {
    init();
}
