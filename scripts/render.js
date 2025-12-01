#!/usr/bin/env node

/**
 * Gantt Chart Renderer
 * Reads JSON config and template, generates HTML output
 */

const fs = require('fs');
const path = require('path');

// Get paths
const configPath = path.join(__dirname, '..', 'config', 'project.json');
const templatePath = path.join(__dirname, '..', 'templates', 'gantt_template.html');
const outputPath = path.join(__dirname, '..', 'output', 'gantt_chart.html');

// Read config
let config;
try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configContent);
    console.log(`✓ Loaded config from ${configPath}`);
} catch (error) {
    console.error(`✗ Error reading config file: ${error.message}`);
    process.exit(1);
}

// Read template
let template;
try {
    template = fs.readFileSync(templatePath, 'utf8');
    console.log(`✓ Loaded template from ${templatePath}`);
} catch (error) {
    console.error(`✗ Error reading template file: ${error.message}`);
    process.exit(1);
}

// Replace placeholder with config
const configJson = JSON.stringify(config, null, 4);
const output = template.replace('{{CONFIG}}', configJson);

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Write output
try {
    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(`✓ Generated HTML at ${outputPath}`);
    console.log(`\n  To preview: open ${outputPath} in a browser`);
} catch (error) {
    console.error(`✗ Error writing output file: ${error.message}`);
    process.exit(1);
}

