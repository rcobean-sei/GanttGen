const { parseJSON } = require('../../scripts/build');
const { loadJSONFixture, createTempFile, cleanupTempFiles } = require('../helpers/testHelpers');
const path = require('path');

describe('parseJSON', () => {
    let tempFiles = [];

    afterEach(() => {
        cleanupTempFiles(tempFiles);
        tempFiles = [];
    });

    test('should parse valid JSON file', () => {
        const validProject = loadJSONFixture('valid-project.json');
        const tempPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(tempPath);

        const config = parseJSON(tempPath);

        expect(config).toBeDefined();
        expect(config.title).toBe('Test Project Timeline');
        expect(config.timelineStart).toBe('2025-01-01');
        expect(config.timelineEnd).toBe('2025-03-31');
        expect(config.tasks).toHaveLength(4);
        expect(config.milestones).toHaveLength(3);
        expect(config.pausePeriods).toHaveLength(1);
    });

    test('should resolve colorIndex to actual colors', () => {
        const validProject = loadJSONFixture('valid-project.json');
        const tempPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(tempPath);

        const config = parseJSON(tempPath);

        expect(config.tasks[0].color).toBe('#F01840'); // colorIndex 0
        expect(config.tasks[1].color).toBe('#402848'); // colorIndex 1
        expect(config.tasks[2].color).toBe('#C01830'); // colorIndex 2
    });

    test('should assign colors from palette when colorIndex is missing', () => {
        const project = loadJSONFixture('valid-project.json');
        // Remove colorIndex from first task
        delete project.tasks[0].colorIndex;
        const tempPath = createTempFile(JSON.stringify(project, null, 2), '.json');
        tempFiles.push(tempPath);

        const config = parseJSON(tempPath);

        expect(config.tasks[0].color).toBeDefined();
        expect(config.tasks[0].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    test('should use default palette when no palette defined', () => {
        const project = loadJSONFixture('valid-project.json');
        delete project.palette;
        const tempPath = createTempFile(JSON.stringify(project, null, 2), '.json');
        tempFiles.push(tempPath);

        const config = parseJSON(tempPath);

        expect(config.palette).toBeDefined();
        expect(Array.isArray(config.palette)).toBe(true);
        expect(config.palette.length).toBeGreaterThan(0);
    });

    test('should handle empty tasks array', () => {
        const project = {
            title: 'Test',
            timelineStart: '2025-01-01',
            timelineEnd: '2025-01-31',
            tasks: []
        };
        const tempPath = createTempFile(JSON.stringify(project, null, 2), '.json');
        tempFiles.push(tempPath);

        const config = parseJSON(tempPath);

        expect(config.tasks).toEqual([]);
    });

    test('should handle missing optional fields', () => {
        const project = {
            title: 'Test',
            timelineStart: '2025-01-01',
            timelineEnd: '2025-01-31',
            tasks: [
                {
                    name: 'Task 1',
                    start: '2025-01-06',
                    end: '2025-01-24',
                    colorIndex: 0
                }
            ]
        };
        const tempPath = createTempFile(JSON.stringify(project, null, 2), '.json');
        tempFiles.push(tempPath);

        const config = parseJSON(tempPath);

        expect(config.milestones).toBeUndefined();
        expect(config.pausePeriods).toBeUndefined();
        expect(config.showMilestones).toBeUndefined();
    });

    test('should handle invalid JSON file', () => {
        const tempPath = createTempFile('{ invalid json }', '.json');
        tempFiles.push(tempPath);

        expect(() => {
            parseJSON(tempPath);
        }).toThrow();
    });

    test('should handle non-existent file', () => {
        const nonExistentPath = path.join(__dirname, 'non-existent-file.json');

        expect(() => {
            parseJSON(nonExistentPath);
        }).toThrow();
    });

    test('should handle tasks with direct color values', () => {
        const project = loadJSONFixture('valid-project.json');
        project.tasks[0].color = '#FF0000';
        project.tasks[0].colorIndex = undefined;
        const tempPath = createTempFile(JSON.stringify(project, null, 2), '.json');
        tempFiles.push(tempPath);

        const config = parseJSON(tempPath);

        expect(config.tasks[0].color).toBe('#FF0000');
    });

    test('should prefer colorIndex over direct color when both present', () => {
        const project = loadJSONFixture('valid-project.json');
        project.tasks[0].color = '#FF0000';
        project.tasks[0].colorIndex = 1; // Should use palette[1] instead
        const tempPath = createTempFile(JSON.stringify(project, null, 2), '.json');
        tempFiles.push(tempPath);

        const config = parseJSON(tempPath);

        expect(config.tasks[0].color).toBe('#402848'); // palette[1]
    });

    test('should handle tasks with subtasks', () => {
        const project = loadJSONFixture('valid-project.json');
        const tempPath = createTempFile(JSON.stringify(project, null, 2), '.json');
        tempFiles.push(tempPath);

        const config = parseJSON(tempPath);

        expect(config.tasks[0].subtasks).toBeDefined();
        expect(Array.isArray(config.tasks[0].subtasks)).toBe(true);
        expect(config.tasks[0].subtasks.length).toBeGreaterThan(0);
    });
});

