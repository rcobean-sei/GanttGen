#!/usr/bin/env node

/**
 * Parse a GanttGen input file (JSON or Excel) and output the parsed data as JSON.
 * Used by the Tauri app to populate manual entry fields from uploaded files.
 */

const { parseExcel, parseJSON } = require('./build.js');
const path = require('path');
const fs = require('fs');

const filePath = process.argv[2];

if (!filePath) {
    console.error('Usage: node parse-file.js <file-path>');
    process.exit(1);
}

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const ext = path.extname(filePath).toLowerCase();
const isExcel = ext === '.xlsx' || ext === '.xls';
const isJSON = ext === '.json';

if (!isExcel && !isJSON) {
    console.error(`Unsupported file format: ${ext}. Expected .json or .xlsx`);
    process.exit(1);
}

(async () => {
    try {
        let config;
        if (isExcel) {
            config = await parseExcel(filePath);
        } else {
            config = parseJSON(filePath);
        }
        
        // Output as JSON to stdout
        console.log(JSON.stringify(config, null, 2));
    } catch (error) {
        console.error(`Error parsing file: ${error.message}`);
        process.exit(1);
    }
})();
