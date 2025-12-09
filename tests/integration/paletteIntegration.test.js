const { build, PALETTE_PRESETS } = require('../../scripts/build');
const { loadJSONFixture, createTempFile, cleanupTempFiles, createTempDir, cleanupTempDir } = require('../helpers/testHelpers');
const fs = require('fs');
const path = require('path');

describe('Palette Integration Tests', () => {
    let tempFiles = [];
    let tempDirs = [];

    afterEach(() => {
        cleanupTempFiles(tempFiles);
        tempDirs.forEach(dir => cleanupTempDir(dir));
        tempFiles = [];
        tempDirs = [];
    });

    const testPalette = async (paletteName, expectedColors) => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: paletteName, exportPng: false });

        const html = fs.readFileSync(outputPath, 'utf8');
        
        // Check that palette colors are in the HTML
        expectedColors.forEach(color => {
            expect(html).toContain(color);
        });
    };

    test('should apply reds palette correctly', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: 'reds', exportPng: false });

        const html = fs.readFileSync(outputPath, 'utf8');
        expect(html).toContain('#F01840'); // RED 1
        expect(html).toContain('#C01830'); // RED 2
    });

    test('should apply purples_a palette with accent color', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: 'purples_a', exportPng: false });

        const html = fs.readFileSync(outputPath, 'utf8');
        // Check for purple colors
        expect(html).toContain('#705E74'); // PURPLE 3
        expect(html).toContain('#402848'); // PURPLE 4
        // Check for accent color
        expect(html).toContain('accentColor');
        expect(html).toContain('#901226'); // RED 3 (burgundy accent)
    });

    test('should apply purples_b palette with accent border', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: 'purples_b', exportPng: false });

        const html = fs.readFileSync(outputPath, 'utf8');
        // Check for accent border
        expect(html).toContain('accentBorder');
        expect(html).toContain('#C01830'); // RED 2 (border accent)
    });

    test('should apply purples_c palette with both accent color and border', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: 'purples_c', exportPng: false });

        const html = fs.readFileSync(outputPath, 'utf8');
        // Check for both accent color and border
        expect(html).toContain('accentColor');
        expect(html).toContain('accentBorder');
        expect(html).toContain('#901226'); // RED 3 (text accent)
        expect(html).toContain('#C01830'); // RED 2 (border accent)
    });

    test('should apply reds_b palette with purple accent border', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: 'reds_b', exportPng: false });

        const html = fs.readFileSync(outputPath, 'utf8');
        // Check for accent border
        expect(html).toContain('accentBorder');
        expect(html).toContain('#402848'); // PURPLE 4 (border accent)
    });

    test('should apply alternating_b palette with red accent border', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: 'alternating_b', exportPng: false });

        const html = fs.readFileSync(outputPath, 'utf8');
        // Check for accent border
        expect(html).toContain('accentBorder');
        expect(html).toContain('#C01830'); // RED 2 (border accent)
    });

    test('should override template palette with preset', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        // Set a different palette in the template
        validProject.palette = ['#FF0000', '#00FF00', '#0000FF'];
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: 'reds', exportPng: false });

        const html = fs.readFileSync(outputPath, 'utf8');
        // Should use reds palette, not the template palette
        expect(html).toContain('#F01840'); // RED 1 from reds palette
        expect(html).not.toContain('#FF0000'); // Should not use template palette
    });
});

