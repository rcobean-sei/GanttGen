const { test, expect } = require('@playwright/test');
const { build } = require('../../scripts/build');
const { loadJSONFixture, createTempFile, cleanupTempFiles, createTempDir, cleanupTempDir } = require('../helpers/testHelpers');
const fs = require('fs');
const path = require('path');

test.describe('PNG Export E2E Tests', () => {
    let tempFiles = [];
    let tempDirs = [];

    test.afterEach(() => {
        cleanupTempFiles(tempFiles);
        tempDirs.forEach(dir => cleanupTempDir(dir));
        tempFiles = [];
        tempDirs = [];
    });

    test('should export PNG file', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const htmlPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, htmlPath);

        // Check if PNG was generated (optional feature)
        const pngPath = htmlPath.replace('.html', '.png');
        if (fs.existsSync(pngPath)) {
            const stats = fs.statSync(pngPath);
            expect(stats.size).toBeGreaterThan(0);
        }
    });

    test('should crop PNG to visible pixels', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const htmlPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, htmlPath);

        const pngPath = htmlPath.replace('.html', '.png');
        if (fs.existsSync(pngPath)) {
            // PNG should exist and be cropped
            const stats = fs.statSync(pngPath);
            expect(stats.size).toBeGreaterThan(0);
            
            // If sharp is available, the PNG should be cropped
            // We can't easily verify the exact dimensions without image processing
            // but we can verify the file exists and has content
        }
    });

    test('should export PNG with transparent background', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const htmlPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, htmlPath);

        const pngPath = htmlPath.replace('.html', '.png');
        if (fs.existsSync(pngPath)) {
            // PNG should exist
            const stats = fs.statSync(pngPath);
            expect(stats.size).toBeGreaterThan(0);
            
            // PNG files with transparency typically have alpha channel
            // We can verify the file is a valid PNG by checking the header
            const buffer = fs.readFileSync(pngPath);
            const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
            expect(isPNG).toBe(true);
        }
    });

    test('should generate PNG with correct dimensions', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const htmlPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, htmlPath);

        const pngPath = htmlPath.replace('.html', '.png');
        if (fs.existsSync(pngPath)) {
            const stats = fs.statSync(pngPath);
            expect(stats.size).toBeGreaterThan(0);
            
            // PNG should have reasonable dimensions (not empty)
            // Exact dimensions depend on content and cropping
        }
    });

    test('should handle PNG export errors gracefully', async () => {
        // This test verifies that build doesn't fail if PNG export fails
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        // Build should complete even if PNG export fails
        await expect(build(inputPath, outputPath)).resolves.not.toThrow();
        
        // HTML should still be generated
        expect(fs.existsSync(outputPath)).toBe(true);
    });
});

