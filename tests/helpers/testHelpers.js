const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Create a temporary file with the given content
 * @param {string} content - File content
 * @param {string} extension - File extension (e.g., '.json', '.xlsx')
 * @returns {string} Path to temporary file
 */
function createTempFile(content, extension = '.tmp') {
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `ganttgen-test-${Date.now()}-${Math.random().toString(36).substring(7)}${extension}`);
    
    if (typeof content === 'string') {
        fs.writeFileSync(tempPath, content, 'utf8');
    } else {
        fs.writeFileSync(tempPath, content);
    }
    
    return tempPath;
}

/**
 * Clean up temporary files
 * @param {string[]} filePaths - Array of file paths to delete
 */
function cleanupTempFiles(filePaths) {
    filePaths.forEach(filePath => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    });
}

/**
 * Load a fixture file
 * @param {string} fixtureName - Name of fixture file (without path)
 * @returns {string} Content of fixture file
 */
function loadFixture(fixtureName) {
    const fixturePath = path.join(__dirname, '..', 'fixtures', fixtureName);
    return fs.readFileSync(fixturePath, 'utf8');
}

/**
 * Load and parse a JSON fixture
 * @param {string} fixtureName - Name of fixture file
 * @returns {object} Parsed JSON object
 */
function loadJSONFixture(fixtureName) {
    const content = loadFixture(fixtureName);
    return JSON.parse(content);
}

/**
 * Assert HTML structure contains expected elements
 * @param {string} html - HTML content
 * @param {object} expectations - Object with expected elements
 */
function assertHTMLStructure(html, expectations) {
    if (expectations.hasTitle !== undefined) {
        if (expectations.hasTitle) {
            expect(html).toMatch(/<h1[^>]*>.*?<\/h1>/);
        } else {
            expect(html).not.toMatch(/<h1[^>]*>.*?<\/h1>/);
        }
    }
    
    if (expectations.hasGanttChart !== undefined) {
        if (expectations.hasGanttChart) {
            expect(html).toMatch(/id=["']gantt-chart["']/);
        } else {
            expect(html).not.toMatch(/id=["']gantt-chart["']/);
        }
    }
    
    if (expectations.taskCount !== undefined) {
        const taskMatches = html.match(/class=["']gantt-row task-row["']/g);
        expect(taskMatches ? taskMatches.length : 0).toBe(expectations.taskCount);
    }
    
    if (expectations.milestoneCount !== undefined) {
        const milestoneMatches = html.match(/class=["']milestone["']/g);
        expect(milestoneMatches ? milestoneMatches.length : 0).toBe(expectations.milestoneCount);
    }
    
    if (expectations.hasPalette !== undefined) {
        if (expectations.hasPalette) {
            expect(html).toMatch(/palette/);
        }
    }
}

/**
 * Create a temporary directory
 * @returns {string} Path to temporary directory
 */
function createTempDir() {
    const tempDir = os.tmpdir();
    const dirPath = path.join(tempDir, `ganttgen-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
}

/**
 * Clean up temporary directory
 * @param {string} dirPath - Path to directory to delete
 */
function cleanupTempDir(dirPath) {
    try {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }
    } catch (error) {
        // Ignore cleanup errors
    }
}

module.exports = {
    createTempFile,
    cleanupTempFiles,
    loadFixture,
    loadJSONFixture,
    assertHTMLStructure,
    createTempDir,
    cleanupTempDir
};

