#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const tauriAppDir = path.join(rootDir, 'tauri-app');
const credsPath = path.join(tauriAppDir, '.applecreds.json');

// Check if credentials file exists
if (!fs.existsSync(credsPath)) {
  console.error('❌ Error: .applecreds.json not found in tauri-app/');
  console.error('   Create this file with your Apple signing credentials:');
  console.error('   {');
  console.error('     "APPLE_SIGNING_IDENTITY": "Developer ID Application: Your Name (TEAMID)",');
  console.error('     "APPLE_ID": "your-email@example.com",');
  console.error('     "APPLE_PASSWORD": "xxxx-xxxx-xxxx-xxxx",');
  console.error('     "APPLE_TEAM_ID": "YOURTEAMID"');
  console.error('   }');
  process.exit(1);
}

// Load credentials
let creds;
try {
  const credsContent = fs.readFileSync(credsPath, 'utf8');
  creds = JSON.parse(credsContent);
} catch (error) {
  console.error('❌ Error: Failed to parse .applecreds.json');
  console.error(`   ${error.message}`);
  process.exit(1);
}

// Validate required fields
const required = ['APPLE_SIGNING_IDENTITY', 'APPLE_ID', 'APPLE_PASSWORD', 'APPLE_TEAM_ID'];
const missing = required.filter(key => !creds[key]);
if (missing.length > 0) {
  console.error('❌ Error: Missing required credentials in .applecreds.json:');
  missing.forEach(key => console.error(`   - ${key}`));
  process.exit(1);
}

// Set environment variables
const env = {
  ...process.env,
  APPLE_SIGNING_IDENTITY: creds.APPLE_SIGNING_IDENTITY,
  APPLE_ID: creds.APPLE_ID,
  APPLE_PASSWORD: creds.APPLE_PASSWORD,
  APPLE_TEAM_ID: creds.APPLE_TEAM_ID
};

console.log('🔐 Loaded Apple credentials from .applecreds.json');
console.log(`   Signing Identity: ${creds.APPLE_SIGNING_IDENTITY}`);
console.log(`   Apple ID: ${creds.APPLE_ID}`);
console.log(`   Team ID: ${creds.APPLE_TEAM_ID}`);
console.log('');

// Run the build
console.log('🔨 Starting Tauri build with signing and notarization...');
console.log('');

const result = spawnSync('npm', ['run', 'tauri:build'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: env
});

if (result.status !== 0) {
  console.error('');
  console.error('❌ Build failed');
  process.exit(result.status || 1);
}

console.log('');
console.log('✅ Build completed with signing and notarization!');
