#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const cachePath = path.join(__dirname, '.version-cache.json');

const files = [
  { path: path.join(rootDir, 'package.json'), key: 'version' },
  { path: path.join(rootDir, 'tauri-app', 'package.json'), key: 'version' },
  { path: path.join(rootDir, 'tauri-app', 'src-tauri', 'tauri.conf.json'), key: 'version' }
];

function getCommit() {
  try {
    return execSync('git rev-parse --short=7 HEAD', { cwd: rootDir }).toString().trim();
  } catch {
    return 'unknown';
  }
}

function getDatetime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function sanitizeIdentifier(value) {
  if (!value) return '';
  return String(value).trim().replace(/[^0-9A-Za-z-]/g, '');
}

function getBaseVersion() {
  const rootPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  return rootPackage.version;
}

function setVersion() {
  if (fs.existsSync(cachePath)) {
    console.log('⚠️  Version already set for this build; skipping.');
    return;
  }

  const baseVersion = (process.env.BASE_VERSION || getBaseVersion()).trim();
  const prereleaseRaw = process.env.BUILD_PRERELEASE || process.env.BUILD_DATETIME || getDatetime();
  const buildRaw = process.env.BUILD_METADATA || process.env.BUILD_COMMIT || getCommit();
  const prerelease = sanitizeIdentifier(prereleaseRaw);
  const buildMetadata = sanitizeIdentifier(buildRaw);

  let versionString = baseVersion;
  if (prerelease) versionString += `-${prerelease}`;
  if (buildMetadata) versionString += `+${buildMetadata}`;

  const cache = { version: versionString, originals: [] };

  files.forEach(({ path: filePath, key }) => {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    cache.originals.push({ path: filePath, value: json[key] });
    json[key] = versionString;
    writeJson(filePath, json);
    console.log(`→ Updated ${filePath} to version ${versionString}`);
  });

  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  console.log(`✅ Version set to ${versionString}`);
}

function resetVersion() {
  if (!fs.existsSync(cachePath)) {
    console.log('ℹ️  No version cache found, nothing to reset.');
    return;
  }

  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  cache.originals.forEach(({ path: filePath, value }) => {
    if (!fs.existsSync(filePath)) return;
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    json.version = value;
    writeJson(filePath, json);
    console.log(`→ Restored ${filePath} to version ${value}`);
  });

  fs.rmSync(cachePath);
  console.log('✅ Version reset to original values.');
}

const command = process.argv[2];

if (command === 'set') {
  setVersion();
} else if (command === 'reset') {
  resetVersion();
} else {
  console.error('Usage: node scripts/manage-version.js [set|reset]');
  process.exit(1);
}
