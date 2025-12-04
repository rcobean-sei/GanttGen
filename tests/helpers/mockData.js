/**
 * Mock data generators for tests
 */

/**
 * Generate a valid project configuration
 * @param {object} overrides - Properties to override
 * @returns {object} Project configuration
 */
function generateValidProject(overrides = {}) {
    const base = {
        title: 'Test Project Timeline',
        timelineStart: '2025-01-01',
        timelineEnd: '2025-03-31',
        showMilestones: true,
        palette: [
            '#F01840',
            '#402848',
            '#C01830',
            '#705E74',
            '#901226',
            '#2A1C30'
        ],
        tasks: [
            {
                name: 'Phase 1: Discovery',
                start: '2025-01-06',
                end: '2025-01-24',
                hours: 40,
                subtasks: [
                    'Stakeholder interviews',
                    'Requirements gathering'
                ],
                colorIndex: 0
            },
            {
                name: 'Phase 2: Planning',
                start: '2025-01-27',
                end: '2025-02-14',
                hours: 30,
                subtasks: [
                    'Define project scope',
                    'Create project plan'
                ],
                colorIndex: 1
            },
            {
                name: 'Phase 3: Execution',
                start: '2025-02-17',
                end: '2025-03-14',
                hours: 60,
                subtasks: [
                    'Implementation tasks',
                    'Quality assurance'
                ],
                colorIndex: 2
            }
        ],
        milestones: [
            {
                name: 'Project Kickoff',
                date: '2025-01-06',
                taskIndex: 0
            },
            {
                name: 'Planning Complete',
                date: '2025-02-14',
                taskIndex: 1
            }
        ],
        pausePeriods: [
            {
                start: '2025-02-10',
                end: '2025-02-12'
            }
        ]
    };
    
    return { ...base, ...overrides };
}

/**
 * Generate an invalid project configuration (missing required fields)
 * @param {object} overrides - Properties to override
 * @returns {object} Invalid project configuration
 */
function generateInvalidProject(overrides = {}) {
    const base = {
        // Missing title
        timelineStart: '2025-01-01',
        timelineEnd: '2025-03-31',
        tasks: [
            {
                name: 'Task 1',
                start: '2025-01-06',
                end: '2025-01-24'
                // Missing colorIndex/color
            }
        ]
    };
    
    return { ...base, ...overrides };
}

/**
 * Generate a task with specific properties
 * @param {object} overrides - Task properties
 * @returns {object} Task object
 */
function generateTask(overrides = {}) {
    const base = {
        name: 'Test Task',
        start: '2025-01-06',
        end: '2025-01-24',
        hours: 20,
        colorIndex: 0
    };
    
    return { ...base, ...overrides };
}

/**
 * Generate a milestone with specific properties
 * @param {object} overrides - Milestone properties
 * @returns {object} Milestone object
 */
function generateMilestone(overrides = {}) {
    const base = {
        name: 'Test Milestone',
        date: '2025-01-15',
        taskIndex: 0
    };
    
    return { ...base, ...overrides };
}

module.exports = {
    generateValidProject,
    generateInvalidProject,
    generateTask,
    generateMilestone
};

