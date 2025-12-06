# GitHub Actions - Quick Start Guide

## 🚀 Automated Electron App Builds

Your repository now has a **fully automated build pipeline** that creates macOS and Windows installers whenever you push code or tags.

---

## 📋 What Gets Built

| Platform | Output Files | Architecture |
|----------|-------------|--------------|
| **macOS** | `.dmg` installer<br>`.zip` archive | Universal (Intel + Apple Silicon) |
| **Windows** | `.exe` NSIS installer<br>Portable `.exe` | 64-bit (x64) |

---

## ⚡ How to Trigger Builds

### 1. Automatic Builds on Push

**Push to your feature branch:**
```bash
git add .
git commit -m "Update Electron app"
git push origin claude/electron-installer-app-0188XCGqJJ2ob6oDXRmRgnQD
```

✅ Workflow automatically builds for both macOS and Windows
✅ Artifacts available for download in ~15 minutes

### 2. Create a Release

**Tag and push:**
```bash
git tag -a v0.5.0-testing -m "Testing release"
git push origin v0.5.0-testing
```

✅ Builds both platforms
✅ **Automatically creates a GitHub Release (draft)**
✅ Attaches all installers to the release

### 3. Manual Trigger

1. Go to: **Actions** tab → **Build Electron App**
2. Click **"Run workflow"**
3. Select branch
4. Click **"Run workflow"** button

---

## 📥 Download Build Artifacts

### From GitHub Actions UI

1. Navigate to: **Actions** → **Build Electron App**
2. Click on the workflow run
3. Scroll to **Artifacts** section
4. Download:
   - `macos-dmg` - macOS disk image
   - `macos-zip` - macOS zip archive
   - `windows-installer` - Windows executables

### From GitHub Release

1. Navigate to: **Releases** tab
2. Find your version (e.g., `v0.5.0-testing`)
3. Download from **Assets** section:
   - `GanttGen-0.5.0.dmg`
   - `GanttGen-0.5.0-mac.zip`
   - `GanttGen-Setup-0.5.0.exe`
   - `GanttGen-0.5.0-win.exe`

---

## 🔄 Workflow Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    TRIGGER EVENT                            │
│  • Push to branch                                           │
│  • Push tag (v*)                                            │
│  • Pull request                                             │
│  • Manual (workflow_dispatch)                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   BUILD JOB (Parallel)                      │
├──────────────────────────┬──────────────────────────────────┤
│      macOS Runner        │      Windows Runner              │
│      (macos-latest)      │      (windows-latest)            │
├──────────────────────────┼──────────────────────────────────┤
│ 1. Checkout code         │ 1. Checkout code                 │
│ 2. Setup Node.js 20      │ 2. Setup Node.js 20              │
│ 3. Install dependencies  │ 3. Install dependencies          │
│ 4. Install Playwright    │ 4. Install Playwright            │
│ 5. Build Electron app    │ 5. Build Electron app            │
│    → npm run build:mac   │    → npm run build:win           │
│ 6. Upload DMG artifact   │ 6. Upload EXE artifacts          │
│ 7. Upload ZIP artifact   │                                  │
└──────────────────────────┴──────────────────────────────────┘
                  │
                  │ (Only if tag pushed)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   RELEASE JOB                               │
│  1. Download all artifacts                                  │
│  2. Prepare release files                                   │
│  3. Create GitHub Release (draft)                           │
│  4. Upload installers as assets                             │
│  5. Generate release notes                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏱️ Build Timeline

| Stage | Duration | Notes |
|-------|----------|-------|
| **Setup** | 1-2 min | Checkout, install Node.js |
| **Dependencies** | 2-3 min | npm install (cached after first run) |
| **Playwright** | 1-2 min | Download Chromium for PNG export |
| **Build macOS** | 5-8 min | Create DMG and ZIP |
| **Build Windows** | 4-6 min | Create EXE installers |
| **Upload** | 1-2 min | Upload artifacts to GitHub |
| **Total** | **~15 min** | Both platforms in parallel |

---

## 📊 Monitoring Builds

### Check Build Status

**GitHub UI:**
- Green checkmark ✅ = Success
- Red X ❌ = Failed
- Yellow circle 🟡 = Running

**In Your Repository:**
1. Look at commit status badges
2. Click on status to see workflow details

### View Detailed Logs

1. Go to **Actions** tab
2. Click on workflow run
3. Click job name (e.g., "Build for mac")
4. Expand each step to see logs
5. Look for errors in red

---

## 🐛 Common Issues & Solutions

### ❌ Build Fails: "npm ci failed"

**Problem:** Dependencies can't be installed

**Solution:**
```bash
cd electron-app
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Update package-lock"
git push
```

### ❌ Build Fails: "electron-builder error"

**Problem:** electron-builder configuration issue

**Solution:**
- Check `electron-app/package.json` → `build` section
- Verify all required fields are present
- Test locally: `cd electron-app && npm run build:mac`

### ❌ Artifacts Not Found

**Problem:** Files not uploaded after build

**Solution:**
- Check build logs for actual output paths
- Verify files created in `electron-app/dist/`
- Ensure glob patterns match in workflow file

### ❌ Release Not Created

**Problem:** Tag pushed but no release

**Solution:**
- Ensure tag starts with `v` (e.g., `v0.5.0`)
- Check that build job succeeded first
- Verify `contents: write` permission in workflow

---

## 🎯 Best Practices

### ✅ Before Pushing

1. **Test locally first:**
   ```bash
   cd electron-app
   npm install
   npm run build:mac  # or build:win on Windows
   ```

2. **Verify package.json:**
   - Version number updated
   - Dependencies correct
   - Build config valid

3. **Check file sizes:**
   - macOS: DMG should be 80-150MB
   - Windows: EXE should be 70-130MB

### ✅ When Creating Releases

1. **Use semantic versioning:**
   - `v0.5.0` - Production release
   - `v0.5.0-testing` - Testing release
   - `v0.5.0-beta` - Beta release

2. **Write good release notes:**
   - Summarize new features
   - List bug fixes
   - Note breaking changes
   - Include installation instructions

3. **Test before publishing:**
   - Download artifacts from draft release
   - Test on both platforms
   - Verify all features work
   - Then publish the release

---

## 🔐 Security Notes

### Code Signing (Currently Disabled)

Apps are **not signed**, which means:

- **macOS:** Users see security warning on first launch
  - Fix: Right-click → Open

- **Windows:** SmartScreen may block
  - Fix: Click "More info" → "Run anyway"

### To Enable Code Signing

Add these secrets to your repository:

**Settings → Secrets and variables → Actions → New repository secret**

**For macOS:**
- `CSC_LINK` - Your Apple Developer certificate (base64 encoded .p12)
- `CSC_KEY_PASSWORD` - Certificate password
- `APPLE_ID` - Your Apple ID
- `APPLE_ID_PASSWORD` - App-specific password

**For Windows:**
- `CSC_LINK` - Your code signing certificate (.pfx)
- `CSC_KEY_PASSWORD` - Certificate password

Then update workflow to remove:
```yaml
env:
  CSC_IDENTITY_AUTO_DISCOVERY: false  # Remove this line
```

---

## 📈 Artifact Retention

| Type | Retention | Location |
|------|-----------|----------|
| **Build artifacts** | 30 days | Actions → Artifacts |
| **Release assets** | Permanent | Releases page |
| **Build logs (on failure)** | 7 days | Actions → Failed run |

---

## 🎓 Advanced Usage

### Run Builds on Pull Requests

Already enabled! The workflow runs when PRs modify:
- `electron-app/**` files
- The workflow file itself

### Customize Build Settings

Edit `.github/workflows/build-electron-app.yml`:

**Change Node.js version:**
```yaml
node-version: '20'  # Change to 18, 21, etc.
```

**Change retention period:**
```yaml
retention-days: 90  # Change from 30
```

**Auto-publish releases:**
```yaml
draft: false  # Change from true
```

### Add Slack/Email Notifications

Add to end of workflow:

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📚 Additional Resources

- **Workflow Details:** `.github/workflows/README.md`
- **Building Locally:** `electron-app/BUILDING.md`
- **Release Process:** `electron-app/RELEASE_INSTRUCTIONS.md`
- **electron-builder Docs:** https://www.electron.build/

---

## ✅ Quick Checklist

**For Regular Development:**
- [ ] Make changes to electron-app
- [ ] Test locally if possible
- [ ] Commit and push to branch
- [ ] Wait for green checkmark ✅
- [ ] Download artifacts from Actions tab
- [ ] Test the built apps

**For Releases:**
- [ ] Update version in package.json
- [ ] Commit all changes
- [ ] Create and push tag: `git tag v0.5.0 && git push origin v0.5.0`
- [ ] Wait for workflow to complete (~15 min)
- [ ] Go to Releases → Find draft release
- [ ] Test downloaded installers
- [ ] Edit release notes if needed
- [ ] Publish release! 🎉

---

**Your Electron app is now building automatically!** 🚀

Just push code or tags, and GitHub Actions handles the rest.
