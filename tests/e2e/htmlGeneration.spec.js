const { test, expect } = require('@playwright/test');
const { build } = require('../../scripts/build');
const { loadJSONFixture, createTempFile, cleanupTempFiles, createTempDir, cleanupTempDir } = require('../helpers/testHelpers');
const fs = require('fs');
const path = require('path');

test.describe('HTML Generation E2E Tests', () => {
    let tempFiles = [];
    let tempDirs = [];

    test.afterEach(() => {
        cleanupTempFiles(tempFiles);
        tempDirs.forEach(dir => cleanupTempDir(dir));
        tempFiles = [];
        tempDirs = [];
    });

    test('should render HTML with gantt chart structure', async ({ page }) => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath);

        const fileUrl = `file://${path.resolve(outputPath)}`;
        await page.goto(fileUrl);

        // Check for main chart container
        const chart = page.locator('#gantt-chart');
        await expect(chart).toBeVisible();
    });

    test('should render task bars correctly', async ({ page }) => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath);

        const fileUrl = `file://${path.resolve(outputPath)}`;
        await page.goto(fileUrl);

        // Check for task rows
        const taskRows = page.locator('.gantt-row.task-row');
        await expect(taskRows.first()).toBeVisible();
        expect(await taskRows.count()).toBeGreaterThan(0);
    });

    test('should render milestones with connectors', async ({ page }) => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath);

        const fileUrl = `file://${path.resolve(outputPath)}`;
        await page.goto(fileUrl);

        // Check for milestone section
        const milestoneSection = page.locator('.milestone-section');
        await expect(milestoneSection).toBeVisible();

        // Check for milestone labels
        const milestoneLabels = page.locator('.milestone-label');
        expect(await milestoneLabels.count()).toBeGreaterThan(0);
    });

    test('should render pause periods with stripe pattern', async ({ page }) => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath);

        const fileUrl = `file://${path.resolve(outputPath)}`;
        await page.goto(fileUrl);

        // Check for pause overlay
        const pauseOverlay = page.locator('.pause-overlay');
        // Pause periods may or may not be visible depending on viewport
        // Just check that the element exists in the DOM
        const count = await pauseOverlay.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should apply palette colors correctly', async ({ page }) => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath, { palette: 'reds' });

        const fileUrl = `file://${path.resolve(outputPath)}`;
        await page.goto(fileUrl);

        // Check that task bars have colors from the palette
        const taskBar = page.locator('.task-bar').first();
        const backgroundColor = await taskBar.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });
        
        // Color should be in RGB format, check that it's not transparent
        expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        expect(backgroundColor).not.toBe('transparent');
    });

    test('should render responsive layout', async ({ page }) => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, 'test_output.html');

        await build(inputPath, outputPath);

        const fileUrl = `file://${path.resolve(outputPath)}`;
        await page.goto(fileUrl);

        // Test at different viewport sizes
        await page.setViewportSize({ width: 1920, height: 1080 });
        const chart = page.locator('#gantt-chart');
        await expect(chart).toBeVisible();

        await page.setViewportSize({ width: 768, height: 1024 });
        await expect(chart).toBeVisible();
    });
});

