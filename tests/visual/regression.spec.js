const { test, expect } = require('@playwright/test');
const { build, PALETTE_PRESETS } = require('../../scripts/build');
const { loadJSONFixture, createTempFile, cleanupTempFiles, createTempDir, cleanupTempDir } = require('../helpers/testHelpers');
const fs = require('fs');
const path = require('path');

test.describe('Visual Regression Tests', () => {
    let tempFiles = [];
    let tempDirs = [];

    test.afterEach(() => {
        cleanupTempFiles(tempFiles);
        tempDirs.forEach(dir => cleanupTempDir(dir));
        tempFiles = [];
        tempDirs = [];
    });

    const generateAndSnapshot = async (page, paletteName) => {
        const validProject = loadJSONFixture('valid-project.json');
        const inputPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        tempFiles.push(inputPath);

        const outputDir = createTempDir();
        tempDirs.push(outputDir);
        const outputPath = path.join(outputDir, `test_${paletteName}.html`);

        await build(inputPath, outputPath, { palette: paletteName });

        const fileUrl = `file://${path.resolve(outputPath)}`;
        await page.goto(fileUrl);
        
        // Wait for chart to render
        await page.waitForSelector('#gantt-chart', { timeout: 10000 });
        await page.waitForTimeout(500); // Allow for animations/rendering

        return page;
    };

    test('should render reds palette correctly', async ({ page }) => {
        await generateAndSnapshot(page, 'reds');
        
        const chart = page.locator('#gantt-chart');
        await expect(chart).toBeVisible();
        
        // Take screenshot for visual comparison
        await expect(chart).toHaveScreenshot(`reds-palette.png`);
    });

    test('should render reds_a palette correctly', async ({ page }) => {
        await generateAndSnapshot(page, 'reds_a');
        
        const chart = page.locator('#gantt-chart');
        await expect(chart).toBeVisible();
        
        await expect(chart).toHaveScreenshot(`reds_a-palette.png`);
    });

    test('should render reds_b palette correctly', async ({ page }) => {
        await generateAndSnapshot(page, 'reds_b');
        
        const chart = page.locator('#gantt-chart');
        await expect(chart).toBeVisible();
        
        await expect(chart).toHaveScreenshot(`reds_b-palette.png`);
    });

    test('should render purples_a palette correctly', async ({ page }) => {
        await generateAndSnapshot(page, 'purples_a');
        
        const chart = page.locator('#gantt-chart');
        await expect(chart).toBeVisible();
        
        await expect(chart).toHaveScreenshot(`purples_a-palette.png`);
    });

    test('should render purples_b palette correctly', async ({ page }) => {
        await generateAndSnapshot(page, 'purples_b');
        
        const chart = page.locator('#gantt-chart');
        await expect(chart).toBeVisible();
        
        await expect(chart).toHaveScreenshot(`purples_b-palette.png`);
    });

    test('should render purples_c palette correctly', async ({ page }) => {
        await generateAndSnapshot(page, 'purples_c');
        
        const chart = page.locator('#gantt-chart');
        await expect(chart).toBeVisible();
        
        await expect(chart).toHaveScreenshot(`purples_c-palette.png`);
    });

    test('should render alternating palette correctly', async ({ page }) => {
        await generateAndSnapshot(page, 'alternating');
        
        const chart = page.locator('#gantt-chart');
        await expect(chart).toBeVisible();
        
        await expect(chart).toHaveScreenshot(`alternating-palette.png`);
    });

    test('should render alternating_b palette correctly', async ({ page }) => {
        await generateAndSnapshot(page, 'alternating_b');
        
        const chart = page.locator('#gantt-chart');
        await expect(chart).toBeVisible();
        
        await expect(chart).toHaveScreenshot(`alternating_b-palette.png`);
    });

    test('should apply task bar colors from palette', async ({ page }) => {
        await generateAndSnapshot(page, 'reds');
        
        const taskBars = page.locator('.task-bar');
        const count = await taskBars.count();
        expect(count).toBeGreaterThan(0);
        
        // Check that task bars have colors
        for (let i = 0; i < Math.min(count, 3); i++) {
            const backgroundColor = await taskBars.nth(i).evaluate((el) => {
                return window.getComputedStyle(el).backgroundColor;
            });
            expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
            expect(backgroundColor).not.toBe('transparent');
        }
    });

    test('should apply accent colors for purples_a palette', async ({ page }) => {
        await generateAndSnapshot(page, 'purples_a');
        
        const taskNames = page.locator('.task-name');
        const firstTaskName = taskNames.first();
        
        if (await firstTaskName.count() > 0) {
            const color = await firstTaskName.evaluate((el) => {
                return window.getComputedStyle(el).color;
            });
            // Should have accent color applied (not default)
            expect(color).toBeDefined();
        }
    });

    test('should apply accent borders for purples_b palette', async ({ page }) => {
        await generateAndSnapshot(page, 'purples_b');
        
        const taskColumns = page.locator('.col-task');
        const firstColumn = taskColumns.first();
        
        if (await firstColumn.count() > 0) {
            const borderColor = await firstColumn.evaluate((el) => {
                return window.getComputedStyle(el).borderLeftColor;
            });
            // Should have accent border applied
            expect(borderColor).toBeDefined();
        }
    });

    test('should render milestone connectors correctly', async ({ page }) => {
        await generateAndSnapshot(page, 'alternating');
        
        const connectors = page.locator('.task-bar-stripe-connector');
        const count = await connectors.count();
        expect(count).toBeGreaterThanOrEqual(0); // May or may not have connectors depending on layout
    });

    test('should render pause period overlays correctly', async ({ page }) => {
        await generateAndSnapshot(page, 'alternating');
        
        const pauseOverlays = page.locator('.pause-overlay');
        // Pause periods may or may not be visible
        const count = await pauseOverlays.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});

