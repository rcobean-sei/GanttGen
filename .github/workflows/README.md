# GitHub Actions - Electron App Build Workflow

## Overview

Automated CI/CD pipeline that builds the GanttGen Electron desktop application for both macOS and Windows platforms.

**Workflow File:** `.github/workflows/build-electron-app.yml`

## Triggers

The workflow runs automatically when:

1. **Push to branches:**
   - `claude/electron-installer-app-*` (feature branches)
   - `main` (production branch)

2. **Push tags:**
   - `v*` (e.g., `v0.5.0`, `v0.5.0-testing`)
   - Automatically creates a GitHub release

3. **Pull Requests:**
   - When changes affect `electron-app/**`
   - When the workflow file itself changes

4. **Manual trigger:**
   - Via GitHub Actions UI (workflow_dispatch)

## Build Matrix

Builds are executed in parallel on:

| Platform | OS | Architecture | Output |
|----------|-----|-------------|--------|
| macOS | `macos-latest` | Universal (Intel + ARM64) | `.dmg`, `.zip` |
| Windows | `windows-latest` | x64 | `.exe` installer, portable `.exe` |

## Jobs

### 1. Build Job

Runs on both macOS and Windows runners in parallel.

#### Steps:

1. **Checkout code**
   - Uses `actions/checkout@v4`
   - Fetches the repository code

2. **Setup Node.js**
   - Version: Node.js 20
   - Caches npm dependencies for faster builds
   - Caches both root and electron-app dependencies

3. **Install root dependencies**
   - Runs `npm ci --legacy-peer-deps`
   - Continues on error (not critical for Electron build)
   - Needed for build scripts used by the app

4. **Install Electron app dependencies**
   - Runs `npm ci` in `electron-app/`
   - Installs Electron and electron-builder

5. **Install Playwright browsers**
   - Installs Chromium for PNG export functionality
   - Includes system dependencies (`--with-deps`)
   - Continues on error (can download later at runtime)

6. **Build Electron app**
   - **macOS:** Runs `npm run build:mac`
     - Creates universal binary (Intel + Apple Silicon)
     - Disables code signing (`CSC_IDENTITY_AUTO_DISCOVERY: false`)
     - Outputs: `.dmg` installer and `.zip` archive

   - **Windows:** Runs `npm run build:win`
     - Creates x64 binaries
     - Outputs: NSIS installer (`.exe`) and portable executable

7. **List build artifacts**
   - Displays contents of `dist/` directory
   - Helps with debugging if files are missing

8. **Upload artifacts**
   - **macOS:**
     - `macos-dmg`: DMG installer files
     - `macos-zip`: ZIP archives

   - **Windows:**
     - `windows-installer`: EXE installer and portable files

   - Retention: 30 days
   - Available for download from Actions UI

9. **Upload build logs** (on failure only)
   - Captures log files for debugging
   - Retention: 7 days

### 2. Release Job

Runs only when a version tag is pushed (e.g., `v0.5.0`).

**Depends on:** Build job must complete successfully

**Permissions:** Requires `contents: write` to create releases

#### Steps:

1. **Checkout code**
   - Gets repository for release notes

2. **Download all artifacts**
   - Downloads macOS and Windows build artifacts
   - Places them in `release-artifacts/` directory

3. **Display artifact structure**
   - Lists downloaded files for verification
   - Helps debug missing files

4. **Prepare release files**
   - Copies all `.dmg`, `.zip`, and `.exe` files to `release-files/`
   - Flattens directory structure for cleaner release

5. **Create GitHub Release**
   - Creates a **draft release** (requires manual publish)
   - Attaches all build artifacts
   - Generates release notes automatically
   - Includes installation instructions and documentation links

## Artifacts

### Build Artifacts (30 day retention)

Available for download from GitHub Actions UI:

- `macos-dmg` - macOS disk image installer
- `macos-zip` - macOS zip archive
- `windows-installer` - Windows executables

### Release Artifacts (permanent)

Attached to GitHub releases when tags are pushed:

- `GanttGen-{version}.dmg` - macOS installer
- `GanttGen-{version}-mac.zip` - macOS archive (universal)
- `GanttGen-Setup-{version}.exe` - Windows NSIS installer
- `GanttGen-{version}-win.exe` - Windows portable executable

## Build Times

Approximate build times:

- **macOS:** 10-15 minutes
- **Windows:** 8-12 minutes
- **Total (parallel):** ~15 minutes

## Environment Variables

### Automatic (set by GitHub)

- `GITHUB_TOKEN` - Authentication for creating releases
- `github.ref_name` - Tag or branch name
- `github.repository` - Repository name (owner/repo)

### Custom (configurable)

- `CSC_IDENTITY_AUTO_DISCOVERY: false` - Disables code signing on macOS
- To enable code signing, set these secrets:
  - `CSC_LINK` - Path/content of signing certificate
  - `CSC_KEY_PASSWORD` - Certificate password
  - `APPLE_ID` - Apple Developer ID
  - `APPLE_ID_PASSWORD` - App-specific password

## Usage Examples

### Trigger a Build (Push to Branch)

```bash
git checkout -b claude/electron-installer-app-feature
# Make changes
git add .
git commit -m "Update Electron app"
git push origin claude/electron-installer-app-feature
```

The workflow will build both platforms and upload artifacts.

### Create a Release

```bash
# Tag the commit
git tag -a v0.5.0 -m "Release version 0.5.0"

# Push the tag
git push origin v0.5.0
```

The workflow will:
1. Build for macOS and Windows
2. Create a draft GitHub release
3. Attach all installers to the release
4. Generate release notes

Then manually:
1. Go to GitHub → Releases
2. Review the draft release
3. Edit release notes if needed
4. Click "Publish release"

### Manual Trigger

1. Go to: Actions → Build Electron App
2. Click "Run workflow"
3. Select branch
4. Click "Run workflow" button

### Download Build Artifacts

1. Go to: Actions → Build Electron App
2. Click on a workflow run
3. Scroll to "Artifacts" section
4. Download `macos-dmg`, `macos-zip`, or `windows-installer`

## Troubleshooting

### Build Fails on Dependency Installation

**Symptom:** `npm ci` fails
**Solution:** Verify `package-lock.json` is committed and up-to-date

```bash
cd electron-app
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
```

### Build Fails on macOS

**Symptom:** DMG creation fails
**Solution:** Check electron-builder configuration in `package.json`

Ensure `build.mac` section is correct:
```json
{
  "mac": {
    "target": ["dmg", "zip"],
    "category": "public.app-category.productivity"
  }
}
```

### Build Fails on Windows

**Symptom:** NSIS installer creation fails
**Solution:** Verify NSIS configuration

Ensure `build.win` and `build.nsis` sections exist in `package.json`

### Artifacts Not Uploaded

**Symptom:** "No files found" warning
**Solution:** Check build output paths

Verify files are created in `electron-app/dist/`:
```bash
# Locally test build
cd electron-app
npm run build:mac  # or build:win
ls -la dist/
```

### Release Not Created

**Symptom:** Release job doesn't run
**Solutions:**
1. Ensure tag starts with `v` (e.g., `v0.5.0`)
2. Check build job completed successfully
3. Verify `contents: write` permission in workflow

### Code Signing Errors

**Symptom:** "Code signing failed"
**Solution:** If you don't need signing, it's already disabled

To enable signing:
1. Add secrets to repository:
   - `CSC_LINK`, `CSC_KEY_PASSWORD` (macOS + Windows)
   - `APPLE_ID`, `APPLE_ID_PASSWORD` (macOS notarization)
2. Remove `CSC_IDENTITY_AUTO_DISCOVERY: false` from workflow

## Customization

### Change Node.js Version

Edit workflow file:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change to '18', '21', etc.
```

### Add Linux Builds

Add to matrix:
```yaml
matrix:
  include:
    - os: ubuntu-latest
      platform: linux
      arch: x64
```

Add build step:
```yaml
- name: Build Electron app (Linux)
  if: matrix.platform == 'linux'
  working-directory: electron-app
  run: npm run build:linux
```

Update `electron-app/package.json`:
```json
{
  "scripts": {
    "build:linux": "electron-builder --linux"
  }
}
```

### Change Artifact Retention

Edit upload steps:
```yaml
- name: Upload macOS DMG
  uses: actions/upload-artifact@v4
  with:
    retention-days: 90  # Change from 30
```

### Enable Auto-Publish Releases

Remove `draft: true` from release step:
```yaml
- name: Create Release
  uses: softprops/action-gh-release@v1
  with:
    draft: false  # Auto-publish instead of draft
```

## Monitoring

### Check Workflow Status

1. Go to: Actions tab in GitHub
2. Select "Build Electron App" workflow
3. View recent runs and their status

### Set Up Notifications

1. Go to: Watch → Custom → Actions
2. Enable notifications for workflow failures

### View Logs

1. Click on a workflow run
2. Click on job name (e.g., "Build for mac")
3. Expand steps to view detailed logs

## Security

### Code Signing

Currently disabled for simplicity. To enable:

1. **macOS:**
   - Obtain Apple Developer certificate
   - Export as `.p12` file
   - Add to repository secrets as `CSC_LINK` (base64 encoded)
   - Add password as `CSC_KEY_PASSWORD`

2. **Windows:**
   - Obtain code signing certificate
   - Export as `.pfx` file
   - Add to repository secrets as `CSC_LINK`
   - Add password as `CSC_KEY_PASSWORD`

### Secrets Management

Never commit secrets to the repository. Use GitHub Secrets:

1. Go to: Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add secret name and value
4. Reference in workflow: `${{ secrets.SECRET_NAME }}`

## Performance Optimization

Current optimizations:

✅ **Parallel builds** - macOS and Windows build simultaneously
✅ **npm caching** - Dependencies cached between runs
✅ **fail-fast: false** - One platform failure doesn't stop the other
✅ **Playwright optimization** - Only installs Chromium (not all browsers)

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [electron-builder Documentation](https://www.electron.build/)
- [actions/upload-artifact](https://github.com/actions/upload-artifact)
- [softprops/action-gh-release](https://github.com/softprops/action-gh-release)

## Support

For issues with the workflow:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review workflow logs in GitHub Actions
3. Create an issue with:
   - Link to failed workflow run
   - Error messages from logs
   - Steps to reproduce
