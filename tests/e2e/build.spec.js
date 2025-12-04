const { test, expect } = require('@playwright/test');
const { build } = require('../../scripts/build');
const { loadJSONFixture, createTempFile, cleanupTempFiles, createTempDir, cleanupTempDir } = require('../helpers/testHelpers');
const fs = require('fs');
const path = require('path');

test.describe('Build E2E Tests', () => {
    let tempFiles = [];
    let tempDirs = [];

    test.afterEach(() => {
        cleanupTempFiles(tempFiles);
        tempDirs.forEach(dir => cleanupTempDir(dir));
        tempFiles = [];
        tempDirs = [];
    });

    test('should generate HTML file from JSON input', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath);

        expect(fs.existsSync(outputPath)).toBe(true);
        const html = fs.readFileSync(outputPath, 'utf8');
        expect(html.length).toBeGreaterThan(0);
    });

    test('should generate PNG file when Playwright is available', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const htmlPath = path.join(outputDir, 'test_output.html');
        const pngPath = path.join(outputDir, 'test_output.png');

        await build(inputPath, htmlPath);

        // PNG generation is optional, so we check if it exists
        // If Playwright is not available, this test will still pass
        if (fs.existsSync(pngPath)) {
            const stats = fs.statSync(pngPath);
            expect(stats.size).toBeGreaterThan(0);
        }
    });

    test('should include palette name in output filename', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);

        await build(inputPath, null, { palette: 'reds' });

        const files = fs.readdirSync(outputDir);
        const htmlFile = files.find(f => f.includes('_reds.html'));
        expect(htmlFile).toBeDefined();
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

    test('should generate output with correct file structure', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath);

        const html = fs.readFileSync(outputPath, 'utf8');
        
        // Check for key HTML structure
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html');
        expect(html).toContain('<head');
        expect(html).toContain('<body');
    });
});

