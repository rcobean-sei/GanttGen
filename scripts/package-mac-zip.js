#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

if (process.platform !== 'darwin') {
  console.log('Skipping mac zip packaging (non-macOS host).');
  process.exit(0);
}

const scriptPath = path.join(__dirname, 'create_mac_zip_bundle.sh');

const result = spawnSync('bash', [scriptPath], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

if (result.status !== 0) {
  console.error('Failed to package mac zip bundle.');
  process.exit(result.status ?? 1);
}

console.log('✅ macOS zip bundle packaged.');
