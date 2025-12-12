// GanttGen Desktop App - Frontend Logic

// Tauri API imports (available via withGlobalTauri)
const { invoke } = window.__TAURI__.core;
const { open, save } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
const { open: shellOpen } = window.__TAURI__.shell;
const { dirname, join: pathJoin, tempDir, desktopDir } = window.__TAURI__.path;
const { writeTextFile } = window.__TAURI__.fs;

// Setup screen elements
const setupElements = {
    overlay: document.getElementById('setupOverlay'),
    statusView: document.getElementById('setupStatusView'),
    installingView: document.getElementById('setupInstallingView'),
    completeView: document.getElementById('setupCompleteView'),
    reqNode: document.getElementById('reqNode'),
    reqNodeStatus: document.getElementById('reqNodeStatus'),
    reqNpm: document.getElementById('reqNpm'),
    reqNpmStatus: document.getElementById('reqNpmStatus'),
    reqDeps: document.getElementById('reqDeps'),
    reqDepsStatus: document.getElementById('reqDepsStatus'),
    reqBrowser: document.getElementById('reqBrowser'),
    reqBrowserStatus: document.getElementById('reqBrowserStatus'),
    recheckBtn: document.getElementById('recheckDepsBtn'),
    installBtn: document.getElementById('installDepsBtn'),
    installBrowserBtn: document.getElementById('installBrowserBtn'),
    setupError: document.getElementById('setupError'),
    setupErrorText: document.getElementById('setupErrorText'),
    installStage: document.getElementById('installStage'),
    setupProgressBar: document.getElementById('setupProgressBar'),
    installLog: document.getElementById('installLog'),
    startAppBtn: document.getElementById('startAppBtn')
};

// State
let state = {
    inputFile: null,
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
    // File import
    importFileBtn: document.getElementById('importFileBtn'),
    fileImportArea: document.getElementById('fileImportArea'),
    dropZone: document.getElementById('dropZone'),
    browseBtn: document.getElementById('browseBtn'),
    selectedFile: document.getElementById('selectedFile'),
    fileName: document.getElementById('fileName'),
    clearFileBtn: document.getElementById('clearFileBtn'),
    manualTab: document.getElementById('manualTab'),
    // Manual entry
    projectTitle: document.getElementById('projectTitle'),
    timelineStart: document.getElementById('timelineStart'),
    timelineEnd: document.getElementById('timelineEnd'),
    tasksList: document.getElementById('tasksList'),
    pauseList: document.getElementById('pauseList'),
    milestonesList: document.getElementById('milestonesList'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    addPauseBtn: document.getElementById('addPauseBtn'),
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
    pngDropShadow: document.getElementById('pngDropShadow'),
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
    viewPngBtn: document.getElementById('viewPngBtn'),
    tryAgainBtn: document.getElementById('tryAgainBtn')
};

let installProgressUnlisten = null;
let appInitialized = false;

// Initialize the app
async function init() {
    // First check dependencies
    const depsReady = await checkAndSetupDependencies();

    if (!depsReady) {
        // Show setup screen and wait for user to install
        return;
    }

    // Dependencies are ready, initialize the main app
    await initializeMainApp();
}

// Initialize the main application UI
async function initializeMainApp() {
    await loadPalettes();
    setupEventListeners();
    setupDragAndDrop();
    setupManualEntry();
    await setupProgressListener();
    initializeDefaultDates();
    await initializeDefaultOutputFolder();
    updateGenerateButton();
}

// Check dependencies and show setup screen if needed
async function checkAndSetupDependencies() {
    try {
        const status = await invoke('check_dependencies');

        // If all dependencies AND browser are installed, skip setup
        if (status.node_available && status.npm_available && status.dependencies_installed && status.browser_installed) {
            return true;
        }

        // Show setup screen
        showSetupScreen(status);
        return false;
    } catch (error) {
        console.error('Failed to check dependencies:', error);
        // If we can't check, assume deps are needed
        showSetupScreen({
            node_available: false,
            npm_available: false,
            dependencies_installed: false,
            browser_installed: false
        });
        return false;
    }
}

// Show the setup screen with current status
function showSetupScreen(status) {
    setupElements.overlay.style.display = 'flex';
    setupElements.statusView.style.display = 'block';
    setupElements.installingView.style.display = 'none';
    setupElements.completeView.style.display = 'none';

    // Update Node.js status
    updateRequirementStatus(
        setupElements.reqNode,
        setupElements.reqNodeStatus,
        status.node_available,
        status.node_version || 'Not found'
    );

    // Update npm status
    updateRequirementStatus(
        setupElements.reqNpm,
        setupElements.reqNpmStatus,
        status.npm_available,
        status.npm_version || 'Not found'
    );

    // Update dependencies status
    updateRequirementStatus(
        setupElements.reqDeps,
        setupElements.reqDepsStatus,
        status.dependencies_installed,
        status.dependencies_installed ? 'Installed' : 'Not installed'
    );

    // Update browser runtime status
    const browserInstalled = Boolean(status.browser_installed);

    if (setupElements.reqBrowser) {
        updateRequirementStatus(
            setupElements.reqBrowser,
            setupElements.reqBrowserStatus,
            browserInstalled,
            browserInstalled ? 'Installed' : 'Not installed'
        );
    }

    // Enable/disable install button based on whether Node.js and npm are available
    const canInstallDeps = status.node_available && status.npm_available && !status.dependencies_installed;
    setupElements.installBtn.disabled = !canInstallDeps;
    // Hide install deps button if dependencies are already installed
    setupElements.installBtn.style.display = status.dependencies_installed ? 'none' : 'inline-flex';

    if (setupElements.installBrowserBtn) {
        // Show browser install button when:
        // - Node/npm are available
        // - Dependencies are installed (or being installed)
        // - Browser is NOT installed
        const canInstallBrowser = status.node_available && status.npm_available && status.dependencies_installed && !browserInstalled;
        setupElements.installBrowserBtn.style.display = canInstallBrowser ? 'inline-flex' : 'none';
        setupElements.installBrowserBtn.disabled = !canInstallBrowser;
    }

    // Show error if Node.js or npm is not available
    if (!status.node_available || !status.npm_available) {
        showSetupError('Node.js and npm are required. Please install Node.js from https://nodejs.org');
    } else if (status.dependencies_installed && browserInstalled) {
        // All dependencies AND browser are installed, close setup and initialize
        hideSetupScreen();
        initializeMainApp();
    } else {
        hideSetupError();
    }

    // Set up button handlers
    setupElements.recheckBtn.onclick = recheckDependencies;
    setupElements.installBtn.onclick = installDependencies;
    if (setupElements.installBrowserBtn) {
        setupElements.installBrowserBtn.onclick = installBrowserRuntime;
    }
    setupElements.startAppBtn.onclick = () => {
        hideSetupScreen();
        initializeMainApp();
    };

    // Set up install progress listener
    setupInstallProgressListener();
}

// Re-check dependencies (called when user clicks Re-check button)
async function recheckDependencies() {
    // Reset status icons to loading state
    resetRequirementToLoading(setupElements.reqNode, setupElements.reqNodeStatus);
    resetRequirementToLoading(setupElements.reqNpm, setupElements.reqNpmStatus);
    resetRequirementToLoading(setupElements.reqDeps, setupElements.reqDepsStatus);
    if (setupElements.reqBrowser) {
        resetRequirementToLoading(setupElements.reqBrowser, setupElements.reqBrowserStatus);
    }

    // Disable buttons during check
    setupElements.recheckBtn.disabled = true;
    setupElements.installBtn.disabled = true;
    if (setupElements.installBrowserBtn) {
        setupElements.installBrowserBtn.disabled = true;
    }
    hideSetupError();

    try {
        const status = await invoke('check_dependencies');

        // If all dependencies AND browser are now installed, close setup and start app
        if (status.node_available && status.npm_available && status.dependencies_installed && status.browser_installed) {
            hideSetupScreen();
            await initializeMainApp();
            return;
        }

        // Update the display with new status
        showSetupScreen(status);
    } catch (error) {
        console.error('Failed to re-check dependencies:', error);
        showSetupError(`Failed to check dependencies: ${error}`);
    } finally {
        setupElements.recheckBtn.disabled = false;
    }
}

function resetRequirementToLoading(element, statusElement) {
    const iconElement = element.querySelector('.requirement-icon');
    iconElement.classList.remove('success', 'error');
    iconElement.classList.add('loading');
    iconElement.innerHTML = `
        <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
    `;
    statusElement.textContent = 'Checking...';
}

function updateRequirementStatus(element, statusElement, isSuccess, statusText) {
    const iconElement = element.querySelector('.requirement-icon');

    // Remove loading state
    iconElement.classList.remove('loading');

    if (isSuccess) {
        iconElement.classList.add('success');
        iconElement.classList.remove('error');
        iconElement.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
    } else {
        iconElement.classList.add('error');
        iconElement.classList.remove('success');
        iconElement.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        `;
    }

    statusElement.textContent = statusText;
}

function showSetupError(message) {
    setupElements.setupError.style.display = 'flex';
    setupElements.setupErrorText.textContent = message;
}

function hideSetupError() {
    setupElements.setupError.style.display = 'none';
}

function hideSetupScreen() {
    setupElements.overlay.style.display = 'none';
}

function beginInstallView(message) {
    setupElements.overlay.style.display = 'flex';
    setupElements.statusView.style.display = 'none';
    setupElements.installingView.style.display = 'block';
    setupElements.completeView.style.display = 'none';
    setupElements.installStage.textContent = message;
    setupElements.setupProgressBar.style.width = '5%';
    setupElements.installLog.innerHTML = '';
    hideSetupError();
}

async function installDependencies() {
    beginInstallView('Installing dependencies...');

    try {
        await invoke('install_dependencies');
        // Success - re-check status to see if browser also needs installing
        const status = await invoke('check_dependencies');
        if (status.browser_installed) {
            // All done - show complete view
            setupElements.installingView.style.display = 'none';
            setupElements.completeView.style.display = 'block';
        } else {
            // Dependencies installed but browser still needed - show status view with browser button
            showSetupScreen(status);
        }
    } catch (error) {
        // Error - go back to status view with error
        setupElements.installingView.style.display = 'none';
        setupElements.statusView.style.display = 'block';
        showSetupError(`Installation failed: ${error}`);

        // Re-check status
        try {
            const status = await invoke('check_dependencies');
            showSetupScreen(status);
        } catch (e) {
            console.error('Failed to re-check dependencies:', e);
        }
    }
}

async function installBrowserRuntime() {
    if (!setupElements.installBrowserBtn || setupElements.installBrowserBtn.disabled) {
        return;
    }

    setupElements.installBrowserBtn.disabled = true;
    beginInstallView('Installing internal browser for PNG export...');

    try {
        await invoke('install_browser_runtime');
        const status = await invoke('check_dependencies');
        if (status.node_available && status.npm_available && status.dependencies_installed && status.browser_installed) {
            hideSetupScreen();
            await initializeMainApp();
        } else {
            showSetupScreen(status);
        }
    } catch (error) {
        setupElements.statusView.style.display = 'block';
        setupElements.installingView.style.display = 'none';
        showSetupError(`Browser install failed: ${error}`);
    } finally {
        setupElements.installBrowserBtn.disabled = false;
    }
}

async function setupInstallProgressListener() {
    if (installProgressUnlisten) {
        return;
    }

    installProgressUnlisten = await listen('install-progress', (event) => {
        const { stage, message, progress, complete, error } = event.payload;

        // Update progress bar
        setupElements.setupProgressBar.style.width = `${progress}%`;

        // Update stage text
        setupElements.installStage.textContent = message;

        // Add to install log panel
        if (message && message.trim()) {
            const logLine = document.createElement('div');
            logLine.textContent = message;
            setupElements.installLog.appendChild(logLine);
            setupElements.installLog.scrollTop = setupElements.installLog.scrollHeight;
        }

        // Also log to debug console
        if (message && message.trim()) {
            const level = error ? 'error' : (stage === 'Error' ? 'error' : 'info');
            addLogEntry({
                level: level,
                source: 'install',
                message: `[${stage}] ${message}`,
                timestamp: new Date().toLocaleTimeString()
            });
        }
    });
}

// Generate a date-time stamp for folder naming
function getDateTimeStamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}`;
}

// Initialize default output folder to Desktop with date-time stamp
async function initializeDefaultOutputFolder() {
    try {
        const desktop = await desktopDir();
        const folderName = `GanttGen_${getDateTimeStamp()}`;
        const defaultFolder = await pathJoin(desktop, folderName);
        state.outputDir = defaultFolder;
        elements.outputDir.value = defaultFolder;
    } catch (error) {
        console.error('Failed to set default output folder:', error);
        // Leave outputDir as null, user will need to select manually
    }
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

function syncViewModeCards(cards) {
    cards.forEach(card => {
        const input = card.querySelector('input[name="viewMode"]');
        card.classList.toggle('selected', input?.checked);
    });
}

function initViewModeCards() {
    const cards = Array.from(document.querySelectorAll('.view-card'));
    if (!cards.length) return;

    cards.forEach(card => {
        const input = card.querySelector('input[name="viewMode"]');
        card.addEventListener('click', () => {
            if (input) {
                input.checked = true;
                syncViewModeCards(cards);
            }
        });
        if (input) {
            input.addEventListener('change', () => syncViewModeCards(cards));
        }
    });

    syncViewModeCards(cards);
}

function setupEventListeners() {
    // Import file button - toggle file import area
    if (elements.importFileBtn && elements.fileImportArea) {
        elements.importFileBtn.addEventListener('click', () => {
            const isVisible = elements.fileImportArea.style.display !== 'none';
            elements.fileImportArea.style.display = isVisible ? 'none' : 'block';
        });
    }

    // Browse button
    if (elements.browseBtn) {
        elements.browseBtn.addEventListener('click', openFileDialog);
    }

    // Clear file button
    if (elements.clearFileBtn) {
        elements.clearFileBtn.addEventListener('click', clearFile);
    }

    // Select output directory
    if (elements.selectOutputBtn) {
        elements.selectOutputBtn.addEventListener('click', selectOutputDirectory);
    }

    // Generate button
    if (elements.generateBtn) {
        elements.generateBtn.addEventListener('click', generateGantt);
    }

    // View mode cards
    initViewModeCards();

    // Result actions
    if (elements.openOutputBtn) {
        elements.openOutputBtn.addEventListener('click', openOutputFolder);
    }
    if (elements.viewHtmlBtn) {
        elements.viewHtmlBtn.addEventListener('click', viewHtmlFile);
    }
    if (elements.viewPngBtn) {
        elements.viewPngBtn.addEventListener('click', viewPngFile);
    }
    if (elements.tryAgainBtn) {
        elements.tryAgainBtn.addEventListener('click', resetResults);
    }
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
    
    // When switching to manual tab, populate UI if we have data
    if (tabId === 'manual') {
        // Don't clear the file - user might want to switch back
        // Populate UI fields from manualData if we have populated data
        const hasData = state.manualData.tasks.length > 0 || state.manualData.title !== 'PROJECT TIMELINE' || 
            state.manualData.timelineStart || state.manualData.timelineEnd;
        if (hasData) {
            populateUIFromManualData();
        }
    }
    
    updateGenerateButton();
}

function setupManualEntry() {
    // Project metadata listeners
    if (elements.projectTitle) {
        elements.projectTitle.addEventListener('input', (e) => {
            state.manualData.title = e.target.value;
            updateJsonPreview();
        });
    }
    
    if (elements.timelineStart) {
        elements.timelineStart.addEventListener('change', (e) => {
            state.manualData.timelineStart = e.target.value;
            renderPausePeriods();
            updateJsonPreview();
            updateGenerateButton();
        });
    }
    
    if (elements.timelineEnd) {
        elements.timelineEnd.addEventListener('change', (e) => {
            state.manualData.timelineEnd = e.target.value;
            renderPausePeriods();
            updateJsonPreview();
            updateGenerateButton();
        });
    }
    
    // Add task/milestone/pause buttons
    if (elements.addTaskBtn) {
        elements.addTaskBtn.addEventListener('click', addTask);
    }
    if (elements.addPauseBtn) {
        elements.addPauseBtn.addEventListener('click', addPausePeriod);
    }
    if (elements.addMilestoneBtn) {
        elements.addMilestoneBtn.addEventListener('click', addMilestone);
    }
    
    // JSON preview toggle
    if (elements.toggleJsonBtn) {
        elements.toggleJsonBtn.addEventListener('click', toggleJsonPreview);
    }
    if (elements.copyJsonBtn) {
        elements.copyJsonBtn.addEventListener('click', copyJson);
    }
    if (elements.saveJsonBtn) {
        elements.saveJsonBtn.addEventListener('click', saveJsonFile);
    }
    
    // Initialize with empty state message
    renderTasks();
    renderPausePeriods();
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
                <p>Each task will be one bar in the Gantt chart.</p>
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
                <label>Subtasks</label>
                <div class="subtasks-container">
                    <div class="subtasks-list" data-task-index="${index}">
                        ${task.subtasks.length === 0 
                            ? '<span class="subtasks-empty">Subtasks will appear as bullets (in order of entry) under a task.</span>'
                            : task.subtasks.map((subtask, subIndex) => `
                                <span class="subtask-chip" data-task-index="${index}" data-subtask-index="${subIndex}">
                                    ${escapeHtml(subtask)}
                                    <button class="remove-subtask" data-task-index="${index}" data-subtask-index="${subIndex}" title="Remove subtask">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </span>
                            `).join('')
                        }
                    </div>
                    <div class="subtask-add-form">
                        <input type="text" class="subtask-input" data-task-index="${index}" placeholder="Add a subtask...">
                        <button class="btn btn-secondary btn-sm add-subtask-btn" data-task-index="${index}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add
                        </button>
                    </div>
                </div>
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
    elements.tasksList.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => removeTask(parseInt(e.currentTarget.dataset.index)));
    });
    
    // Subtask event listeners
    elements.tasksList.querySelectorAll('.add-subtask-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskIndex = parseInt(e.currentTarget.dataset.taskIndex);
            const input = elements.tasksList.querySelector(`.subtask-input[data-task-index="${taskIndex}"]`);
            if (input && input.value.trim()) {
                addSubtask(taskIndex, input.value.trim());
                input.value = '';
            }
        });
    });
    
    elements.tasksList.querySelectorAll('.subtask-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const taskIndex = parseInt(e.target.dataset.taskIndex);
                if (e.target.value.trim()) {
                    addSubtask(taskIndex, e.target.value.trim());
                    e.target.value = '';
                }
            }
        });
    });
    
    elements.tasksList.querySelectorAll('.remove-subtask').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskIndex = parseInt(e.currentTarget.dataset.taskIndex);
            const subtaskIndex = parseInt(e.currentTarget.dataset.subtaskIndex);
            removeSubtask(taskIndex, subtaskIndex);
        });
    });
}

function addSubtask(taskIndex, subtaskText) {
    state.manualData.tasks[taskIndex].subtasks.push(subtaskText);
    renderTasks();
    updateJsonPreview();
    
    // Refocus the subtask input for this task so user can add another
    const subtaskInput = elements.tasksList.querySelector(`.subtask-input[data-task-index="${taskIndex}"]`);
    if (subtaskInput) {
        subtaskInput.focus();
    }
}

function removeSubtask(taskIndex, subtaskIndex) {
    state.manualData.tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
    renderTasks();
    updateJsonPreview();
}

function addPausePeriod() {
    const baseline = state.manualData.timelineStart
        ? new Date(state.manualData.timelineStart)
        : new Date();
    const startDate = formatDateForInput(baseline);

    const tentativeEnd = new Date(baseline);
    tentativeEnd.setDate(tentativeEnd.getDate() + 7);

    let finalEnd = tentativeEnd;
    if (state.manualData.timelineEnd) {
        const timelineEnd = new Date(state.manualData.timelineEnd);
        if (timelineEnd < tentativeEnd) {
            finalEnd = timelineEnd < baseline ? baseline : timelineEnd;
        }
    }

    state.manualData.pausePeriods.push({
        start: startDate,
        end: formatDateForInput(finalEnd)
    });

    renderPausePeriods();
    updateJsonPreview();
}

function removePausePeriod(index) {
    state.manualData.pausePeriods.splice(index, 1);
    renderPausePeriods();
    updateJsonPreview();
}

function updatePausePeriod(index, field, value) {
    if (!state.manualData.pausePeriods[index]) return;
    state.manualData.pausePeriods[index][field] = value;
    validatePausePeriod(index);
    updateJsonPreview();
}

function validatePausePeriod(index) {
    const pause = state.manualData.pausePeriods[index];
    if (!pause) return;

    const pauseCard = elements.pauseList?.querySelector(`.pause-card[data-index="${index}"]`);
    if (!pauseCard) return;

    const startInput = pauseCard.querySelector('.pause-start-input');
    const endInput = pauseCard.querySelector('.pause-end-input');
    const existingWarning = pauseCard.querySelector('.pause-warning');

    if (existingWarning) existingWarning.remove();
    if (startInput) startInput.classList.remove('input-error');
    if (endInput) endInput.classList.remove('input-error');

    const hasStart = Boolean(pause.start);
    const hasEnd = Boolean(pause.end);
    const timelineStart = state.manualData.timelineStart ? new Date(state.manualData.timelineStart) : null;
    const timelineEnd = state.manualData.timelineEnd ? new Date(state.manualData.timelineEnd) : null;

    let warningMessage = '';

    if (!hasStart) {
        warningMessage = 'Start date is required.';
        if (startInput) startInput.classList.add('input-error');
    } else if (!hasEnd) {
        warningMessage = 'End date is required.';
        if (endInput) endInput.classList.add('input-error');
    } else {
        const startDate = new Date(pause.start);
        const endDate = new Date(pause.end);

        if (startDate > endDate) {
            warningMessage = 'Start date must be on or before the end date.';
            if (startInput) startInput.classList.add('input-error');
            if (endInput) endInput.classList.add('input-error');
        } else if (timelineStart && startDate < timelineStart) {
            warningMessage = `Start date should be on or after ${formatDateUS(state.manualData.timelineStart)}.`;
            if (startInput) startInput.classList.add('input-error');
        } else if (timelineEnd && endDate > timelineEnd) {
            warningMessage = `End date should be on or before ${formatDateUS(state.manualData.timelineEnd)}.`;
            if (endInput) endInput.classList.add('input-error');
        }
    }

    if (warningMessage) {
        const warning = document.createElement('div');
        warning.className = 'pause-warning';
        warning.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>${warningMessage}</span>
        `;
        pauseCard.appendChild(warning);
    }
}

function renderPausePeriods() {
    if (!elements.pauseList) return;

    if (state.manualData.pausePeriods.length === 0) {
        elements.pauseList.innerHTML = `
            <div class="empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2h12"></path>
                    <path d="M6 22h12"></path>
                    <path d="M6 2v5a5 5 0 0 0 5 5L11 12a5 5 0 0 0-5 5v5"></path>
                    <path d="M18 2v5a5 5 0 0 1-5 5l0 0a5 5 0 0 1 5 5v5"></path>
                </svg>
                <p>Use pause blocks to mark periods when work should halt. They create a visual indicator of a pause in work.</p>
            </div>
        `;
        return;
    }

    elements.pauseList.innerHTML = state.manualData.pausePeriods.map((pause, index) => `
        <div class="pause-card" data-index="${index}">
            <div class="pause-card-header">
                <div class="pause-card-title">
                    <span class="task-number">${index + 1}</span>
                    <span>Pause Block</span>
                </div>
                <button class="btn-icon delete-pause-btn" data-index="${index}" title="Remove pause block">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
            <p class="pause-card-description">
                Tasks that span this range will split and show diagonal overlays in the chart.
            </p>
            <div class="form-grid pause-form-grid">
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="date" class="pause-start-input" data-index="${index}" value="${pause.start || ''}">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="date" class="pause-end-input" data-index="${index}" value="${pause.end || ''}">
                </div>
            </div>
        </div>
    `).join('');

    elements.pauseList.querySelectorAll('.pause-start-input').forEach(input => {
        input.addEventListener('change', (e) => updatePausePeriod(parseInt(e.target.dataset.index), 'start', e.target.value));
    });
    elements.pauseList.querySelectorAll('.pause-end-input').forEach(input => {
        input.addEventListener('change', (e) => updatePausePeriod(parseInt(e.target.dataset.index), 'end', e.target.value));
    });
    elements.pauseList.querySelectorAll('.delete-pause-btn').forEach(btn => {
        btn.addEventListener('click', (e) => removePausePeriod(parseInt(e.currentTarget.dataset.index)));
    });

    state.manualData.pausePeriods.forEach((_, index) => validatePausePeriod(index));
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

    // Validate milestone date is within task span
    validateMilestoneDate(index);
    updateJsonPreview();
}

function validateMilestoneDate(milestoneIndex) {
    const milestone = state.manualData.milestones[milestoneIndex];
    if (!milestone) return;

    const taskIndex = milestone.taskIndex;
    const task = state.manualData.tasks[taskIndex];

    // Get the milestone card element for showing validation state
    const milestoneCard = elements.milestonesList?.querySelector(`.milestone-card[data-index="${milestoneIndex}"]`);
    const dateInput = milestoneCard?.querySelector('.milestone-date-input');
    const existingWarning = milestoneCard?.querySelector('.milestone-date-warning');

    // Remove existing warning if any
    if (existingWarning) {
        existingWarning.remove();
    }

    // If no task or no milestone date, skip validation
    if (!task || !milestone.date) {
        if (dateInput) dateInput.classList.remove('input-error');
        return;
    }

    const milestoneDate = new Date(milestone.date);
    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);

    // Check if milestone date is within task span
    if (milestoneDate < taskStart || milestoneDate > taskEnd) {
        if (dateInput) {
            dateInput.classList.add('input-error');

            // Add warning message with US date format
            const warning = document.createElement('div');
            warning.className = 'milestone-date-warning';
            warning.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>Date should be between ${formatDateUS(task.start)} and ${formatDateUS(task.end)}</span>
            `;
            dateInput.parentNode.appendChild(warning);
        }
    } else {
        if (dateInput) dateInput.classList.remove('input-error');
    }
}

// Format date as MM/DD/YYYY for US locale
function formatDateUS(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

function renderMilestones() {
    if (state.manualData.milestones.length === 0) {
        elements.milestonesList.innerHTML = `
            <div class="empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                    <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
                <p>Use to call out special dates, deliverables, or other notable points in the timeline.</p>
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

        // Parse the file and populate manual data
        try {
            const fileContent = await invoke('parse_file', { path: filePath });
            const config = JSON.parse(fileContent);
            populateManualDataFromConfig(config);
            populateUIFromManualData();
            
            // Collapse file import area after successful import
            elements.fileImportArea.style.display = 'none';
        } catch (parseError) {
            console.warn('Could not parse file for manual entry:', parseError);
            // Don't show error to user - file is still valid for generation
        }

        updateGenerateButton();
    } catch (error) {
        alert(`Invalid file: ${error}`);
    }
}

function populateManualDataFromConfig(config) {
    // Populate project metadata
    if (config.title) {
        state.manualData.title = config.title;
    }
    if (config.timelineStart) {
        state.manualData.timelineStart = config.timelineStart;
    }
    if (config.timelineEnd) {
        state.manualData.timelineEnd = config.timelineEnd;
    }

    // Populate tasks
    if (config.tasks && Array.isArray(config.tasks)) {
        state.manualData.tasks = config.tasks.map(task => ({
            name: task.name || '',
            start: task.start || '',
            end: task.end || '',
            hours: task.hours || 0,
            subtasks: task.subtasks || []
        }));
    }

    // Populate milestones
    if (config.milestones && Array.isArray(config.milestones)) {
        state.manualData.milestones = config.milestones.map(milestone => ({
            name: milestone.name || '',
            date: milestone.date || '',
            taskIndex: milestone.taskIndex !== undefined ? milestone.taskIndex : null
        }));
    }

    // Populate pause periods
    if (config.pausePeriods && Array.isArray(config.pausePeriods)) {
        state.manualData.pausePeriods = config.pausePeriods.map(pause => ({
            start: pause.start || '',
            end: pause.end || '',
            label: pause.label || ''
        }));
    }
}

function populateUIFromManualData() {
    // Populate project metadata fields
    if (elements.projectTitle) {
        elements.projectTitle.value = state.manualData.title || '';
    }
    if (elements.timelineStart) {
        elements.timelineStart.value = state.manualData.timelineStart || '';
    }
    if (elements.timelineEnd) {
        elements.timelineEnd.value = state.manualData.timelineEnd || '';
    }

    // Render tasks, milestones, and pause periods
    renderTasks();
    renderMilestones();
    renderPausePeriods();
    updateJsonPreview();
}

function clearFile() {
    state.inputFile = null;
    elements.selectedFile.style.display = 'none';
    elements.dropZone.style.display = 'block';
    elements.fileImportArea.style.display = 'none';
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
    // Manual mode: need at least one task and valid dates
    const canGenerate = !state.isGenerating && 
        state.manualData.tasks.length > 0 &&
        state.manualData.timelineStart &&
        state.manualData.timelineEnd;
    
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
        // Always create a temp JSON file from manual entry data
        updateProgress(5, 'Creating project file...');
        const jsonData = getManualDataAsJson();
        const jsonString = JSON.stringify(jsonData, null, 2);
        
        // Create temp file path
        const tempDirPath = await tempDir();
        const timestamp = Date.now();
        const inputPath = await pathJoin(tempDirPath, `ganttgen_temp_${timestamp}.json`);
        
        // Write temp file
        await writeTextFile(inputPath, jsonString);
        
        const options = {
            input_path: inputPath,
            output_path: state.outputDir ? `${state.outputDir}/output_gantt_chart.html` : null,
            palette: state.selectedPalette,
            export_png: elements.exportPng ? elements.exportPng.checked : false,
            png_drop_shadow: elements.pngDropShadow ? elements.pngDropShadow.checked : false,
            view_mode: document.querySelector('input[name="viewMode"]:checked')?.value || 'day'
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

    // Show/hide view buttons based on what was generated
    elements.viewHtmlBtn.disabled = !result.html_path;
    
    // For PNG button: enable if png_path exists, or if HTML was generated and PNG export was checked
    // (PNG should be in same directory as HTML with .png extension)
    let pngPath = result.png_path;
    if (!pngPath && result.html_path && elements.exportPng && elements.exportPng.checked) {
        // Fallback: construct PNG path from HTML path if PNG export was requested
        pngPath = result.html_path.replace(/\.html$/, '.png');
    }
    elements.viewPngBtn.disabled = !pngPath;
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
    let folderPath = null;

    if (state.lastResult?.html_path) {
        try {
            folderPath = await dirname(state.lastResult.html_path);
        } catch (error) {
            console.error('Failed to get directory from html_path:', error);
        }
    }

    if (!folderPath && state.outputDir) {
        folderPath = state.outputDir;
    }

    if (folderPath) {
        try {
            await invoke('open_folder', { path: folderPath });
        } catch (error) {
            console.error('Failed to open folder:', error);
            alert(`Unable to open folder: ${folderPath}\nError: ${error}`);
        }
    } else {
        alert('No output folder available. Generate a chart first.');
    }
}

async function viewHtmlFile() {
    if (state.lastResult?.html_path) {
        try {
            await invoke('open_file', { path: state.lastResult.html_path });
        } catch (error) {
            console.error('Failed to open HTML file:', error);
            alert(`Unable to open file: ${state.lastResult.html_path}\nError: ${error}`);
        }
    } else {
        alert('No HTML file available. Generate a chart first.');
    }
}

async function viewPngFile() {
    if (state.lastResult?.png_path) {
        try {
            await invoke('open_file', { path: state.lastResult.png_path });
        } catch (error) {
            console.error('Failed to open PNG file:', error);
            alert(`Unable to open file: ${state.lastResult.png_path}\nError: ${error}`);
        }
    } else {
        alert('No PNG file available. Generate a chart with PNG export enabled first.');
    }
}

// Debug console state
const debugState = {
    logs: [],
    expanded: false,
    filters: {
        info: true,
        debug: true,
        warn: true,
        error: true
    }
};

// Debug console elements
const debugElements = {
    console: document.getElementById('debugConsole'),
    header: document.getElementById('debugHeader'),
    content: document.getElementById('debugContent'),
    log: document.getElementById('debugLog'),
    count: document.getElementById('debugCount'),
    toggleBtn: document.getElementById('toggleDebugBtn'),
    clearBtn: document.getElementById('clearLogsBtn'),
    exportBtn: document.getElementById('exportLogsBtn'),
    filterInfo: document.getElementById('filterInfo'),
    filterDebug: document.getElementById('filterDebug'),
    filterWarn: document.getElementById('filterWarn'),
    filterError: document.getElementById('filterError')
};

// Export logs to file
async function exportLogs() {
    try {
        const { save } = window.__TAURI__.dialog;
        const { writeTextFile } = window.__TAURI__.fs;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `ganttgen-logs-${timestamp}.txt`;
        
        const filePath = await save({
            defaultPath: filename,
            filters: [{
                name: 'Text Files',
                extensions: ['txt']
            }]
        });
        
        if (filePath) {
            const logContent = debugState.logs.map(log => {
                const stackTrace = log.stack ? `\nStack: ${log.stack}` : '';
                return `[${log.timestamp}] [${log.source}] [${log.level.toUpperCase()}] ${log.message}${stackTrace}`;
            }).join('\n');
            
            await writeTextFile(filePath, logContent);
            addLogEntry({
                level: 'info',
                source: 'system',
                message: `Logs exported to ${filePath}`,
                timestamp: new Date().toLocaleTimeString()
            });
        }
    } catch (error) {
        console.error('Failed to export logs:', error);
        addLogEntry({
            level: 'error',
            source: 'system',
            message: `Failed to export logs: ${error}`,
            timestamp: new Date().toLocaleTimeString()
        });
    }
}

// Setup global error handlers
function setupGlobalErrorHandlers() {
    // Catch uncaught JavaScript errors
    window.onerror = (message, source, lineno, colno, error) => {
        const errorMessage = error ? error.toString() : String(message);
        const stack = error ? error.stack : `at ${source}:${lineno}:${colno}`;
        
        addLogEntry({
            level: 'error',
            source: 'javascript',
            message: `Uncaught error: ${errorMessage}`,
            stack: stack,
            timestamp: new Date().toLocaleTimeString()
        });
        
        // Don't prevent default error handling
        return false;
    };
    
    // Catch unhandled promise rejections
    window.onunhandledrejection = (event) => {
        const reason = event.reason;
        const errorMessage = reason instanceof Error ? reason.toString() : String(reason);
        const stack = reason instanceof Error ? reason.stack : undefined;
        
        addLogEntry({
            level: 'error',
            source: 'javascript',
            message: `Unhandled promise rejection: ${errorMessage}`,
            stack: stack,
            timestamp: new Date().toLocaleTimeString()
        });
        
        // Prevent default browser console error
        event.preventDefault();
    };
}

// Initialize debug console
function initDebugConsole() {
    // Toggle console
    debugElements.header.addEventListener('click', toggleDebugConsole);

    // Clear logs
    debugElements.clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearLogs();
    });
    
    // Export logs button
    if (debugElements.exportBtn) {
        debugElements.exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportLogs();
        });
    }

    // Filter checkboxes
    debugElements.filterInfo.addEventListener('change', () => {
        debugState.filters.info = debugElements.filterInfo.checked;
        renderLogs();
    });
    debugElements.filterDebug.addEventListener('change', () => {
        debugState.filters.debug = debugElements.filterDebug.checked;
        renderLogs();
    });
    debugElements.filterWarn.addEventListener('change', () => {
        debugState.filters.warn = debugElements.filterWarn.checked;
        renderLogs();
    });
    debugElements.filterError.addEventListener('change', () => {
        debugState.filters.error = debugElements.filterError.checked;
        renderLogs();
    });

    // Listen for app-log events from Rust
    listen('app-log', (event) => {
        addLogEntry(event.payload);
    });

    // Add initial log entry
    addLogEntry({
        level: 'info',
        source: 'system',
        message: 'GanttGen started',
        timestamp: new Date().toLocaleTimeString()
    });
}

function toggleDebugConsole() {
    debugState.expanded = !debugState.expanded;
    debugElements.console.classList.toggle('expanded', debugState.expanded);
    debugElements.content.style.display = debugState.expanded ? 'block' : 'none';
}

function addLogEntry(entry) {
    debugState.logs.push(entry);
    updateLogCount();
    renderLogs();

    // Auto-scroll to bottom
    debugElements.log.scrollTop = debugElements.log.scrollHeight;
}

function clearLogs() {
    debugState.logs = [];
    updateLogCount();
    renderLogs();
}

function updateLogCount() {
    const count = debugState.logs.length;
    debugElements.count.textContent = `${count} ${count === 1 ? 'entry' : 'entries'}`;
}

function renderLogs() {
    const filteredLogs = debugState.logs.filter(log => debugState.filters[log.level]);

    debugElements.log.innerHTML = filteredLogs.map(log => {
        const stackTrace = log.stack ? `<div class="log-stack">${escapeHtml(log.stack)}</div>` : '';
        return `
        <div class="log-entry level-${log.level}">
            <span class="log-timestamp">${log.timestamp}</span>
            <span class="log-source">[${log.source}]</span>
            <span class="log-message">${escapeHtml(log.message)}</span>
            ${stackTrace}
        </div>
    `;
    }).join('');
}

// Load and display build info
async function loadBuildInfo() {
    try {
        const buildInfo = await invoke('get_build_info');
        const footer = document.querySelector('.footer p');
        if (!footer) return;

        if (buildInfo.is_release) {
            footer.textContent = '';
            return;
        }

        const formatted = (() => {
            const date = new Date(buildInfo.datetime.replace('_', 'T'));
            if (isNaN(date.getTime())) {
                return buildInfo.datetime;
            }
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const yyyy = date.getFullYear();
            const hh = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const ss = String(date.getSeconds()).padStart(2, '0');
            return `${mm}-${dd}-${yyyy} ${hh}:${min}:${ss}`;
        })();

        footer.textContent = `${buildInfo.branch}:${buildInfo.commit_short} (${formatted})`;
    } catch (error) {
        console.error('Failed to load build info:', error);
        // Fallback to default if build info fails to load
    }
}

// Initialize when DOM is ready
async function bootstrapApplication() {
    if (appInitialized) {
        return;
    }
    appInitialized = true;
    setupGlobalErrorHandlers();
    initDebugConsole();
    await init();
    loadBuildInfo();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApplication);
} else {
    bootstrapApplication();
}
