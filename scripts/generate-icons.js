#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const generatorDir = path.join(rootDir, 'tools', 'icon-generator');
const tauriDir = path.join(rootDir, 'tauri-app');
const macOutput = path.join(generatorDir, 'output', 'icon-mac.png');
const windowsOutput = path.join(generatorDir, 'output', 'icon-windows.png');
const windowsIconDir = path.join(generatorDir, 'output', 'win-icons');
const tauriIconsDir = path.join(tauriDir, 'src-tauri', 'icons');
const KEEP_FILES = new Set(['32x32.png', '64x64.png', '128x128.png', '128x128@2x.png', 'icon.png', 'icon.icns', 'icon.ico', 'icon.svg']);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed`);
  }
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function pruneMainIconDir() {
  const entries = fs.readdirSync(tauriIconsDir);
  entries.forEach((entry) => {
    if (!KEEP_FILES.has(entry)) {
      fs.rmSync(path.join(tauriIconsDir, entry), { recursive: true, force: true });
    }
  });
}

try {
  console.log('▶ Generating macOS icon (no drop shadow)…');
  run('node', ['generate-icon.js', '--config', 'configs/mac.json', '--output', macOutput], {
    cwd: generatorDir
  });
  run('npx', ['tauri', 'icon', macOutput], { cwd: tauriDir });

  console.log('▶ Generating Windows icon (with drop shadow)…');
  run('node', ['generate-icon.js', '--config', 'configs/windows.json', '--output', windowsOutput], {
    cwd: generatorDir
  });
  ensureCleanDir(windowsIconDir);
  run('npx', ['tauri', 'icon', windowsOutput, '-o', windowsIconDir], { cwd: tauriDir });

  const sourceIco = path.join(windowsIconDir, 'icon.ico');
  const destIco = path.join(tauriIconsDir, 'icon.ico');
  fs.copyFileSync(sourceIco, destIco);
  console.log(`✅ Copied Windows .ico with drop shadow to ${destIco}`);

  pruneMainIconDir();

  console.log('🎉 Icon generation complete! PNG assets in src-tauri/icons use the macOS styling.');
} catch (error) {
  console.error('Icon generation failed:', error.message);
  process.exit(1);
}
