// Create a self-contained HTML for screenshot capture
const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../src/styles.css');
const previewPath = path.join(__dirname, '../preview.html');
const outputPath = path.join(__dirname, '../screenshots/screenshot-source.html');

// Read CSS
const css = fs.readFileSync(cssPath, 'utf8');

// Read preview HTML and extract body content
const previewHtml = fs.readFileSync(previewPath, 'utf8');
const bodyMatch = previewHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
const bodyContent = bodyMatch ? bodyMatch[1] : '';

// Create self-contained HTML
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GanttGen - Screenshot</title>
    <style>
${css}
    </style>
</head>
<body>
${bodyContent}
</body>
</html>`;

// Ensure screenshots directory exists
const screenshotsDir = path.dirname(outputPath);
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

fs.writeFileSync(outputPath, fullHtml);
console.log('Created:', outputPath);
