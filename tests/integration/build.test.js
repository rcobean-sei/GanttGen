const { build } = require('../../scripts/build');
const { loadJSONFixture, createTempFile, cleanupTempFiles, createTempDir, cleanupTempDir } = require('../helpers/testHelpers');
const path = require('path');
const fs = require('fs');

describe('Build Integration Tests', () => {
    let tempFiles = [];
    let tempDirs = [];

    afterEach(() => {
        cleanupTempFiles(tempFiles);
        tempDirs.forEach(dir => cleanupTempDir(dir));
        tempFiles = [];
        tempDirs = [];
    });

    test('should build from JSON input', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath);

        expect(fs.existsSync(outputPath)).toBe(true);
        const html = fs.readFileSync(outputPath, 'utf8');
        expect(html).toContain('gantt-chart');
        expect(html).toContain('Test Project Timeline');
    });

    test('should build from Excel input', async () => {
        const excelPath = path.join(__dirname, '..', 'fixtures', 'test-template.xlsx');
        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(excelPath, outputPath);

        expect(fs.existsSync(outputPath)).toBe(true);
        const html = fs.readFileSync(outputPath, 'utf8');
        expect(html).toContain('gantt-chart');
    });

    test('should apply palette preset', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: 'reds' });

        const html = fs.readFileSync(outputPath, 'utf8');
        // Check that reds palette colors are in the HTML
        expect(html).toContain('#F01840'); // RED 1
    });

    test('should generate output with palette suffix in filename', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output_purples_a.html');

        await build(inputPath, outputPath, { palette: 'purples_a' });

        // Check that file was created with palette suffix
        expect(fs.existsSync(outputPath)).toBe(true);
        expect(outputPath).toContain('purples_a');
    });

    test('should handle build errors gracefully', async () => {
        const invalidProject = loadJSONFixture('invalid-project.json');
        const inputPath = createTempFile(JSON.stringify(invalidProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await expect(build(inputPath, outputPath)).rejects.toThrow();
    });

    test('should generate HTML with correct structure', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath);

        const html = fs.readFileSync(outputPath, 'utf8');
        
        // Check for key HTML elements
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<div id="gantt-chart"');
        expect(html).toContain('class="gantt-row task-row"');
        expect(html).toContain('Phase 1: Discovery');
    });

    test('should include milestones in output', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath);

        const html = fs.readFileSync(outputPath, 'utf8');
        expect(html).toContain('Project Kickoff');
        expect(html).toContain('milestone-section');
    });

    test('should apply accent colors for palette variants', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: 'purples_a' });

        const html = fs.readFileSync(outputPath, 'utf8');
        // Check for accent color in config
        expect(html).toContain('accentColor');
        expect(html).toContain('#901226'); // RED 3 (burgundy accent)
    });

    test('should apply accent borders for palette variants', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: 'reds_b' });

        const html = fs.readFileSync(outputPath, 'utf8');
        // Check for accent border in config
        expect(html).toContain('accentBorder');
        expect(html).toContain('#402848'); // PURPLE 4 (border accent)
    });
});

