const { assignTaskColors, collectSubtasks, BRAND_COLORS } = require('../../scripts/build');

describe('Utility Functions', () => {
    describe('assignTaskColors', () => {

        test('should assign colors to tasks', () => {
            const colors = assignTaskColors(3);
            expect(colors).toHaveLength(3);
            colors.forEach(color => {
                expect(BRAND_COLORS).toContain(color);
            });
        });

        test('should ensure no two adjacent tasks have the same color', () => {
            const colors = assignTaskColors(10);
            for (let i = 1; i < colors.length; i++) {
                expect(colors[i]).not.toBe(colors[i - 1]);
            }
        });

        test('should handle single task', () => {
            const colors = assignTaskColors(1);
            expect(colors).toHaveLength(1);
            expect(BRAND_COLORS).toContain(colors[0]);
        });

        test('should handle zero tasks', () => {
            const colors = assignTaskColors(0);
            expect(colors).toHaveLength(0);
        });

        test('should handle large number of tasks', () => {
            const colors = assignTaskColors(100);
            expect(colors).toHaveLength(100);
            // Verify no adjacent duplicates
            for (let i = 1; i < colors.length; i++) {
                expect(colors[i]).not.toBe(colors[i - 1]);
            }
        });

        test('should return valid hex colors', () => {
            const colors = assignTaskColors(5);
            colors.forEach(color => {
                expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
            });
        });
    });

    describe('collectSubtasks', () => {
        test('should collect subtasks from row data', () => {
            const row = {
                subtask1: 'Subtask 1',
                subtask2: 'Subtask 2',
                subtask3: 'Subtask 3',
                subtask4: '',
                subtask5: null,
                subtask6: undefined,
                subtask7: '   ',
                subtask8: 'Subtask 8',
                subtask9: '',
                subtask10: ''
            };

            const subtasks = collectSubtasks(row);
            expect(subtasks).toEqual(['Subtask 1', 'Subtask 2', 'Subtask 3', 'Subtask 8']);
        });

        test('should handle empty subtasks', () => {
            const row = {
                subtask1: '',
                subtask2: null,
                subtask3: undefined,
                subtask4: '   ',
                subtask5: '',
                subtask6: '',
                subtask7: '',
                subtask8: '',
                subtask9: '',
                subtask10: ''
            };

            const subtasks = collectSubtasks(row);
            expect(subtasks).toEqual([]);
        });

        test('should handle all 10 subtasks', () => {
            const row = {};
            for (let i = 1; i <= 10; i++) {
                row[`subtask${i}`] = `Subtask ${i}`;
            }

            const subtasks = collectSubtasks(row);
            expect(subtasks).toHaveLength(10);
            expect(subtasks[0]).toBe('Subtask 1');
            expect(subtasks[9]).toBe('Subtask 10');
        });

        test('should trim whitespace from subtasks', () => {
            const row = {
                subtask1: '  Subtask 1  ',
                subtask2: 'Subtask 2',
                subtask3: ''
            };

            const subtasks = collectSubtasks(row);
            expect(subtasks).toEqual(['Subtask 1', 'Subtask 2']);
        });
    });
});

