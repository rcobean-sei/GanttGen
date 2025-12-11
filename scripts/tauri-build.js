#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    ...options
  });
  if (result.status !== 0) {
    const cmd = [command, ...args].join(' ');
    throw new Error(`Command failed: ${cmd}`);
  }
}

(async () => {
  try {
    run('npm', ['run', 'icons:generate']);
    run('npm', ['--prefix', 'tauri-app', 'run', 'tauri:build']);
    run('node', ['scripts/package-mac-zip.js']);
    console.log('✅ Tauri build completed successfully.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
})();
