// GanttGen Desktop App - Frontend Logic

// Tauri API imports (available via withGlobalTauri)
const { invoke } = window.__TAURI__.core;
const { open, save } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
const { open: shellOpen } = window.__TAURI__.shell;
const { dirname, join: pathJoin, tempDir } = window.__TAURI__.path;
const { writeTextFile } = window.__TAURI__.fs;

// State
let state = {
    inputFile: null,
    inputMode: 'file', // 'file' or 'manual'
    selectedPalette: 'alternating',
    outputDir: null,
    isGenerating: false,
    lastResult: null,
    // Manual entry state
    manualData: {
        title: 'PROJECT TIMELINE',
        timelineStart: '',
        timelineEnd: '',
        tasks: [],
        milestones: [],
        pausePeriods: []
    }
};

// DOM Elements
const elements = {
    // Tab navigation
    tabBtns: document.querySelectorAll('.tab-btn'),
    fileTab: document.getElementById('fileTab'),
    manualTab: document.getElementById('manualTab'),
    // File import
    dropZone: document.getElementById('dropZone'),
    browseBtn: document.getElementById('browseBtn'),
    selectedFile: document.getElementById('selectedFile'),
    fileName: document.getElementById('fileName'),
    clearFileBtn: document.getElementById('clearFileBtn'),
    // Manual entry
    projectTitle: document.getElementById('projectTitle'),
    timelineStart: document.getElementById('timelineStart'),
    timelineEnd: document.getElementById('timelineEnd'),
    tasksList: document.getElementById('tasksList'),
    milestonesList: document.getElementById('milestonesList'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    addMilestoneBtn: document.getElementById('addMilestoneBtn'),
    toggleJsonBtn: document.getElementById('toggleJsonBtn'),
    jsonPreview: document.getElementById('jsonPreview'),
    jsonEditor: document.getElementById('jsonEditor'),
    copyJsonBtn: document.getElementById('copyJsonBtn'),
    saveJsonBtn: document.getElementById('saveJsonBtn'),
    // Palette and output
    paletteGrid: document.getElementById('paletteGrid'),
    exportHtml: document.getElementById('exportHtml'),
    exportPng: document.getElementById('exportPng'),
    outputDir: document.getElementById('outputDir'),
    selectOutputBtn: document.getElementById('selectOutputBtn'),
    generateBtn: document.getElementById('generateBtn'),
    // Progress and results
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
    setupManualEntry();
    await setupProgressListener();
    initializeDefaultDates();
    updateGenerateButton();
}

// Initialize default dates for manual entry
function initializeDefaultDates() {
    const today = new Date();
    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    
    elements.timelineStart.value = formatDateForInput(today);
    elements.timelineEnd.value = formatDateForInput(threeMonthsLater);
    
    state.manualData.timelineStart = elements.timelineStart.value;
    state.manualData.timelineEnd = elements.timelineEnd.value;
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
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
    // Tab navigation
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

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

function switchTab(tabId) {
    state.inputMode = tabId;
    
    // Update tab buttons
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update tab content
    elements.fileTab.classList.toggle('active', tabId === 'file');
    elements.manualTab.classList.toggle('active', tabId === 'manual');
    
    // Clear file selection when switching to manual
    if (tabId === 'manual') {
        state.inputFile = null;
    }
    
    updateGenerateButton();
}

function setupManualEntry() {
    // Project metadata listeners
    elements.projectTitle.addEventListener('input', (e) => {
        state.manualData.title = e.target.value;
        updateJsonPreview();
    });
    
    elements.timelineStart.addEventListener('change', (e) => {
        state.manualData.timelineStart = e.target.value;
        updateJsonPreview();
        updateGenerateButton();
    });
    
    elements.timelineEnd.addEventListener('change', (e) => {
        state.manualData.timelineEnd = e.target.value;
        updateJsonPreview();
        updateGenerateButton();
    });
    
    // Add task/milestone buttons
    elements.addTaskBtn.addEventListener('click', addTask);
    elements.addMilestoneBtn.addEventListener('click', addMilestone);
    
    // JSON preview toggle
    elements.toggleJsonBtn.addEventListener('click', toggleJsonPreview);
    elements.copyJsonBtn.addEventListener('click', copyJson);
    elements.saveJsonBtn.addEventListener('click', saveJsonFile);
    
    // Initialize with empty state message
    renderTasks();
    renderMilestones();
}

function addTask() {
    const taskIndex = state.manualData.tasks.length;
    const startDate = state.manualData.timelineStart || formatDateForInput(new Date());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // 2 weeks default duration
    
    state.manualData.tasks.push({
        name: `Task ${taskIndex + 1}`,
        start: startDate,
        end: formatDateForInput(endDate),
        hours: 40,
        subtasks: [],
        colorIndex: taskIndex % 6
    });
    
    renderTasks();
    updateJsonPreview();
    updateGenerateButton();
}

function removeTask(index) {
    state.manualData.tasks.splice(index, 1);
    // Re-index colorIndex for remaining tasks
    state.manualData.tasks.forEach((task, i) => {
        task.colorIndex = i % 6;
    });
    renderTasks();
    updateJsonPreview();
    updateGenerateButton();
}

function updateTask(index, field, value) {
    if (field === 'subtasks') {
        // Parse subtasks from comma or newline separated string
        state.manualData.tasks[index].subtasks = value
            .split(/[,\n]/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    } else if (field === 'hours') {
        state.manualData.tasks[index].hours = parseInt(value) || 0;
    } else {
        state.manualData.tasks[index][field] = value;
    }
    updateJsonPreview();
}

function renderTasks() {
    if (state.manualData.tasks.length === 0) {
        elements.tasksList.innerHTML = `
            <div class="empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p>No tasks yet. Click "Add Task" to create your first task.</p>
            </div>
        `;
        return;
    }
    
    elements.tasksList.innerHTML = state.manualData.tasks.map((task, index) => `
        <div class="task-card" data-index="${index}">
            <div class="task-card-header">
                <div class="task-card-title">
                    <span class="task-number">${index + 1}</span>
                    <span>Task</span>
                </div>
                <div class="task-card-actions">
                    <button class="btn-icon delete-task-btn" data-index="${index}" title="Remove task">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group" style="grid-column: span 2;">
                    <label>Task Name</label>
                    <input type="text" class="task-name-input" data-index="${index}" value="${escapeHtml(task.name)}" placeholder="Enter task name">
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="date" class="task-start-input" data-index="${index}" value="${task.start}">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="date" class="task-end-input" data-index="${index}" value="${task.end}">
                </div>
                <div class="form-group">
                    <label>Hours (optional)</label>
                    <input type="number" class="task-hours-input" data-index="${index}" value="${task.hours || ''}" placeholder="0">
                </div>
            </div>
            <div class="subtasks-section">
                <label>Subtasks (one per line or comma-separated)</label>
                <textarea class="subtasks-input task-subtasks-input" data-index="${index}" placeholder="Enter subtasks...">${task.subtasks.join('\n')}</textarea>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to task inputs
    elements.tasksList.querySelectorAll('.task-name-input').forEach(input => {
        input.addEventListener('input', (e) => updateTask(parseInt(e.target.dataset.index), 'name', e.target.value));
    });
    elements.tasksList.querySelectorAll('.task-start-input').forEach(input => {
        input.addEventListener('change', (e) => updateTask(parseInt(e.target.dataset.index), 'start', e.target.value));
    });
    elements.tasksList.querySelectorAll('.task-end-input').forEach(input => {
        input.addEventListener('change', (e) => updateTask(parseInt(e.target.dataset.index), 'end', e.target.value));
    });
    elements.tasksList.querySelectorAll('.task-hours-input').forEach(input => {
        input.addEventListener('input', (e) => updateTask(parseInt(e.target.dataset.index), 'hours', e.target.value));
    });
    elements.tasksList.querySelectorAll('.task-subtasks-input').forEach(input => {
        input.addEventListener('input', (e) => updateTask(parseInt(e.target.dataset.index), 'subtasks', e.target.value));
    });
    elements.tasksList.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => removeTask(parseInt(e.currentTarget.dataset.index)));
    });
}

function addMilestone() {
    const milestoneDate = state.manualData.timelineStart || formatDateForInput(new Date());
    
    state.manualData.milestones.push({
        name: `Milestone ${state.manualData.milestones.length + 1}`,
        date: milestoneDate,
        taskIndex: 0
    });
    
    renderMilestones();
    updateJsonPreview();
}

function removeMilestone(index) {
    state.manualData.milestones.splice(index, 1);
    renderMilestones();
    updateJsonPreview();
}

function updateMilestone(index, field, value) {
    if (field === 'taskIndex') {
        state.manualData.milestones[index].taskIndex = parseInt(value) || 0;
    } else {
        state.manualData.milestones[index][field] = value;
    }
    updateJsonPreview();
}

function renderMilestones() {
    if (state.manualData.milestones.length === 0) {
        elements.milestonesList.innerHTML = `
            <div class="empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                    <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
                <p>No milestones yet. Click "Add Milestone" to mark important dates.</p>
            </div>
        `;
        return;
    }
    
    const taskOptions = state.manualData.tasks.map((task, i) => 
        `<option value="${i}">${i + 1}. ${escapeHtml(task.name)}</option>`
    ).join('');
    
    elements.milestonesList.innerHTML = state.manualData.milestones.map((milestone, index) => `
        <div class="milestone-card" data-index="${index}">
            <div class="milestone-card-header">
                <div class="milestone-card-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                        <line x1="4" y1="22" x2="4" y2="15"></line>
                    </svg>
                    <span>Milestone</span>
                </div>
                <div class="milestone-card-actions">
                    <button class="btn-icon delete-milestone-btn" data-index="${index}" title="Remove milestone">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Milestone Name</label>
                    <input type="text" class="milestone-name-input" data-index="${index}" value="${escapeHtml(milestone.name)}" placeholder="Enter milestone name">
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" class="milestone-date-input" data-index="${index}" value="${milestone.date}">
                </div>
                <div class="form-group">
                    <label>Associated Task</label>
                    <select class="milestone-task-input" data-index="${index}">
                        ${state.manualData.tasks.length === 0 
                            ? '<option value="0">No tasks available</option>' 
                            : taskOptions}
                    </select>
                </div>
            </div>
        </div>
    `).join('');
    
    // Set selected task index
    elements.milestonesList.querySelectorAll('.milestone-task-input').forEach((select, index) => {
        select.value = state.manualData.milestones[index].taskIndex;
    });
    
    // Add event listeners to milestone inputs
    elements.milestonesList.querySelectorAll('.milestone-name-input').forEach(input => {
        input.addEventListener('input', (e) => updateMilestone(parseInt(e.target.dataset.index), 'name', e.target.value));
    });
    elements.milestonesList.querySelectorAll('.milestone-date-input').forEach(input => {
        input.addEventListener('change', (e) => updateMilestone(parseInt(e.target.dataset.index), 'date', e.target.value));
    });
    elements.milestonesList.querySelectorAll('.milestone-task-input').forEach(input => {
        input.addEventListener('change', (e) => updateMilestone(parseInt(e.target.dataset.index), 'taskIndex', e.target.value));
    });
    elements.milestonesList.querySelectorAll('.delete-milestone-btn').forEach(btn => {
        btn.addEventListener('click', (e) => removeMilestone(parseInt(e.currentTarget.dataset.index)));
    });
}

function getManualDataAsJson() {
    return {
        title: state.manualData.title,
        timelineStart: state.manualData.timelineStart,
        timelineEnd: state.manualData.timelineEnd,
        showMilestones: state.manualData.milestones.length > 0,
        tasks: state.manualData.tasks.map(task => ({
            name: task.name,
            start: task.start,
            end: task.end,
            hours: task.hours || undefined,
            subtasks: task.subtasks.length > 0 ? task.subtasks : undefined,
            colorIndex: task.colorIndex
        })),
        milestones: state.manualData.milestones,
        pausePeriods: state.manualData.pausePeriods
    };
}

function updateJsonPreview() {
    if (elements.jsonPreview.style.display !== 'none') {
        const jsonData = getManualDataAsJson();
        elements.jsonEditor.value = JSON.stringify(jsonData, null, 2);
    }
}

function toggleJsonPreview() {
    const isVisible = elements.jsonPreview.style.display !== 'none';
    elements.jsonPreview.style.display = isVisible ? 'none' : 'block';
    elements.toggleJsonBtn.innerHTML = isVisible 
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
           </svg> Show JSON`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
           </svg> Hide JSON`;
    
    if (!isVisible) {
        updateJsonPreview();
    }
}

async function copyJson() {
    const jsonData = getManualDataAsJson();
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    try {
        await navigator.clipboard.writeText(jsonString);
        // Brief visual feedback
        const originalText = elements.copyJsonBtn.textContent;
        elements.copyJsonBtn.textContent = 'Copied!';
        setTimeout(() => {
            elements.copyJsonBtn.textContent = originalText;
        }, 1500);
    } catch (error) {
        console.error('Failed to copy:', error);
    }
}

async function saveJsonFile() {
    const jsonData = getManualDataAsJson();
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    try {
        const filePath = await save({
            filters: [{
                name: 'JSON',
                extensions: ['json']
            }],
            defaultPath: 'gantt_project.json'
        });
        
        if (filePath) {
            await writeTextFile(filePath, jsonString);
            // Use this saved file as input
            state.inputFile = filePath;
            updateGenerateButton();
        }
    } catch (error) {
        console.error('Failed to save file:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    
    if (state.inputMode === 'file') {
        canGenerate = state.inputFile && !state.isGenerating;
    } else if (state.inputMode === 'manual') {
        // Manual mode: need at least one task and valid dates
        canGenerate = !state.isGenerating && 
            state.manualData.tasks.length > 0 &&
            state.manualData.timelineStart &&
            state.manualData.timelineEnd;
    }
    
    elements.generateBtn.disabled = !canGenerate;
}

function updateProgress(percent, text) {
    elements.progressBar.style.width = `${percent}%`;
    elements.progressText.textContent = text;
}

async function generateGantt() {
    if (state.isGenerating) return;
    
    // Validate input based on mode
    if (state.inputMode === 'file' && !state.inputFile) return;
    if (state.inputMode === 'manual' && state.manualData.tasks.length === 0) return;

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
        let inputPath = state.inputFile;
        
        // For manual mode, create a temp JSON file
        if (state.inputMode === 'manual') {
            updateProgress(5, 'Creating project file...');
            const jsonData = getManualDataAsJson();
            const jsonString = JSON.stringify(jsonData, null, 2);
            
            // Create temp file path
            const tempDirPath = await tempDir();
            const timestamp = Date.now();
            inputPath = await pathJoin(tempDirPath, `ganttgen_temp_${timestamp}.json`);
            
            // Write temp file
            await writeTextFile(inputPath, jsonString);
        }
        
        const options = {
            input_path: inputPath,
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
