# GanttGen

A lightweight, data-driven Gantt chart generator using vanilla HTML, CSS, and JavaScript.

## Features

- **Data-driven configuration**: Update tasks, dates, colors, and milestones through a simple JavaScript CONFIG object
- **Color-coded milestones**: Visual connectors linking milestones to their associated tasks
- **Responsive timeline**: Automatically calculates grid layout based on date ranges
- **Subtasks support**: Add bullet-pointed subtasks under main tasks
- **Week boundaries**: Visual markers for week starts
- **No dependencies**: Pure HTML/CSS/JS - no external libraries required

## Usage

1. Open `gantt_chart.html` in your browser
2. Edit the `CONFIG` object in the `<script>` section to customize:
   - Timeline start/end dates
   - Task names, dates, colors, and estimated hours
   - Milestone dates and associations
   - Subtasks for each task

## Configuration Example

```javascript
const CONFIG = {
    title: "PROJECT TIMELINE",
    timelineStart: "2025-12-01",
    timelineEnd: "2026-02-07",
    
    tasks: [
        {
            name: "Planning & Preparation",
            start: "2025-12-02",
            end: "2025-12-12",
            color: "#dc3545",
            hours: 20,
            subtasks: [
                "Define scope",
                "Determine test scenarios",
                "Baseline environment setup"
            ]
        }
        // ... more tasks
    ],
    
    milestones: [
        { 
            name: "Project\nKickoff", 
            date: "2025-12-02", 
            taskIndex: 0 
        }
        // ... more milestones
    ]
};
```

## Export

To use in presentations:
1. Open the HTML file in a browser
2. Take a screenshot or print to PDF
3. Insert into PowerPoint or other presentation tools

## License

Created for project timeline visualization and planning.

