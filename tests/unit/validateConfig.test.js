const { validateConfig } = require('../../scripts/build');
const { generateValidProject, generateInvalidProject, generateTask } = require('../helpers/mockData');

// Helper to resolve colorIndex to color for validation
function resolveTaskColors(config) {
    if (config.palette && Array.isArray(config.palette) && config.palette.length > 0) {
        if (config.tasks && Array.isArray(config.tasks)) {
            config.tasks.forEach(task => {
                if (task.colorIndex !== undefined && !task.color) {
                    const colorIndex = Number(task.colorIndex);
                    if (!isNaN(colorIndex) && colorIndex >= 0 && colorIndex < config.palette.length) {
                        task.color = config.palette[colorIndex];
                    }
                }
            });
        }
    }
    return config;
}

describe('validateConfig', () => {
    test('should pass validation for valid configuration', () => {
        const config = resolveTaskColors(generateValidProject());
        expect(() => validateConfig(config)).not.toThrow();
    });

    test('should throw error for missing title', () => {
        const config = generateValidProject({ title: '' });
        expect(() => validateConfig(config)).toThrow('Missing required field: title');
    });

    test('should throw error for missing timelineStart', () => {
        const config = generateValidProject({ timelineStart: '' });
        expect(() => validateConfig(config)).toThrow('Missing required field: timelineStart');
    });

    test('should throw error for missing timelineEnd', () => {
        const config = generateValidProject({ timelineEnd: '' });
        expect(() => validateConfig(config)).toThrow('Missing required field: timelineEnd');
    });

    test('should throw error when timelineStart is after timelineEnd', () => {
        const config = generateValidProject({
            timelineStart: '2025-03-31',
            timelineEnd: '2025-01-01'
        });
        expect(() => validateConfig(config)).toThrow('timelineStart must be before timelineEnd');
    });

    test('should throw error when timelineStart equals timelineEnd', () => {
        const config = generateValidProject({
            timelineStart: '2025-01-01',
            timelineEnd: '2025-01-01'
        });
        expect(() => validateConfig(config)).toThrow('timelineStart must be before timelineEnd');
    });

    test('should throw error for missing tasks array', () => {
        const config = generateValidProject({ tasks: null });
        expect(() => validateConfig(config)).toThrow('Missing or invalid tasks array');
    });

    test('should throw error for task without name', () => {
        const config = generateValidProject({
            tasks: [generateTask({ name: '' })]
        });
        expect(() => validateConfig(config)).toThrow('Task 1: Missing name');
    });

    test('should throw error for task without start date', () => {
        const config = generateValidProject({
            tasks: [generateTask({ start: '' })]
        });
        expect(() => validateConfig(config)).toThrow('Task 1: Missing start date');
    });

    test('should throw error for task without end date', () => {
        const config = generateValidProject({
            tasks: [generateTask({ end: '' })]
        });
        expect(() => validateConfig(config)).toThrow('Task 1: Missing end date');
    });

    test('should throw error for task without color', () => {
        const config = generateValidProject({
            tasks: [generateTask({ color: undefined, colorIndex: undefined })]
        });
        expect(() => validateConfig(config)).toThrow('Task 1: Missing color');
    });

    test('should throw error when task start is after task end', () => {
        const config = generateValidProject({
            tasks: [generateTask({
                start: '2025-01-24',
                end: '2025-01-06'
            })]
        });
        expect(() => validateConfig(config)).toThrow('start date must be before end date');
    });

    test('should throw error when task start equals task end', () => {
        const config = generateValidProject({
            tasks: [generateTask({
                start: '2025-01-06',
                end: '2025-01-06'
            })]
        });
        expect(() => validateConfig(config)).toThrow('start date must be before end date');
    });

    test('should include task name in error message', () => {
        const config = generateValidProject({
            tasks: [generateTask({
                name: 'Test Task',
                start: '2025-01-24',
                end: '2025-01-06'
            })]
        });
        expect(() => validateConfig(config)).toThrow('Test Task');
    });

    test('should validate multiple tasks', () => {
        const config = resolveTaskColors(generateValidProject({
            tasks: [
                generateTask({ name: 'Task 1', start: '2025-01-06', end: '2025-01-24' }),
                generateTask({ name: 'Task 2', start: '2025-01-27', end: '2025-02-14' })
            ]
        }));
        expect(() => validateConfig(config)).not.toThrow();
    });

    test('should throw multiple errors for multiple invalid tasks', () => {
        const config = generateValidProject({
            tasks: [
                generateTask({ name: '' }),
                generateTask({ start: '' })
            ]
        });
        expect(() => validateConfig(config)).toThrow('Task 1: Missing name');
        expect(() => validateConfig(config)).toThrow('Task 2: Missing start date');
    });
});

