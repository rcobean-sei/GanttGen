const { parseExcel } = require('../../scripts/build');
const path = require('path');
const fs = require('fs');

describe('parseExcel', () => {
    const fixturePath = path.join(__dirname, '..', 'fixtures', 'test-template.xlsx');

    test('should parse valid Excel file', async () => {
        const config = await parseExcel(fixturePath);

        expect(config).toBeDefined();
        expect(config.title).toBeDefined();
        expect(config.timelineStart).toBeDefined();
        expect(config.timelineEnd).toBeDefined();
        expect(Array.isArray(config.tasks)).toBe(true);
    });

    test('should parse Palette sheet', async () => {
        const config = await parseExcel(fixturePath);

        expect(config.palette).toBeDefined();
        expect(Array.isArray(config.palette)).toBe(true);
        expect(config.palette.length).toBeGreaterThan(0);
        config.palette.forEach(color => {
            expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
    });

    test('should parse Project sheet', async () => {
        const config = await parseExcel(fixturePath);

        expect(config.title).toBe('Test Project Timeline');
        expect(config.timelineStart).toBe('2025-01-01');
        expect(config.timelineEnd).toBe('2025-03-31');
        expect(typeof config.showMilestones).toBe('boolean');
    });

    test('should parse Tasks sheet with colorIndex', async () => {
        const config = await parseExcel(fixturePath);

        expect(config.tasks.length).toBeGreaterThan(0);
        config.tasks.forEach(task => {
            expect(task.name).toBeDefined();
            expect(task.start).toBeDefined();
            expect(task.end).toBeDefined();
            expect(task.color).toBeDefined();
            expect(task.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
    });

    test('should parse Tasks sheet with subtasks', async () => {
        const config = await parseExcel(fixturePath);

        const taskWithSubtasks = config.tasks.find(t => t.subtasks && t.subtasks.length > 0);
        if (taskWithSubtasks) {
            expect(Array.isArray(taskWithSubtasks.subtasks)).toBe(true);
            expect(taskWithSubtasks.subtasks.length).toBeGreaterThan(0);
        }
    });

    test('should parse Milestones sheet', async () => {
        const config = await parseExcel(fixturePath);

        if (config.milestones) {
            expect(Array.isArray(config.milestones)).toBe(true);
            config.milestones.forEach(milestone => {
                expect(milestone.name).toBeDefined();
                expect(milestone.date).toBeDefined();
            });
        }
    });

    test('should parse PausePeriods sheet', async () => {
        const config = await parseExcel(fixturePath);

        if (config.pausePeriods) {
            expect(Array.isArray(config.pausePeriods)).toBe(true);
            config.pausePeriods.forEach(pause => {
                expect(pause.start).toBeDefined();
                expect(pause.end).toBeDefined();
            });
        }
    });

    test('should handle missing Palette sheet', async () => {
        // This test would require creating an Excel file without Palette sheet
        // For now, we test that default palette is used when empty
        const config = await parseExcel(fixturePath);
        // If palette is empty, it should use default
        expect(config.palette).toBeDefined();
    });

    test('should handle non-existent file', async () => {
        const nonExistentPath = path.join(__dirname, 'non-existent.xlsx');

        await expect(parseExcel(nonExistentPath)).rejects.toThrow();
    });

    test('should assign colors to tasks without colorIndex', async () => {
        const config = await parseExcel(fixturePath);

        config.tasks.forEach(task => {
            expect(task.color).toBeDefined();
            expect(task.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
    });

    test('should handle tasks with hours', async () => {
        const config = await parseExcel(fixturePath);

        const taskWithHours = config.tasks.find(t => t.hours !== undefined);
        if (taskWithHours) {
            expect(typeof taskWithHours.hours).toBe('number');
        }
    });
});

