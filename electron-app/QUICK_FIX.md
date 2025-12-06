# Quick Fix Reference Card

## ✅ Fixed Issues

### 1. macOS Now Builds ARM64 Only ✓
- **Before:** Universal binary (Intel + Apple Silicon)
- **After:** Apple Silicon (ARM64) only
- **Benefits:**
  - Smaller file size
  - Faster builds
  - Clear target platform

### 2. Added Post-Build Verification ✓
Every build is now automatically verified for:

**macOS Checks:**
- ✅ App bundle structure valid
- ✅ Main executable exists
- ✅ Info.plist present
- ✅ Correct architecture (arm64)
- ✅ DMG installer created
- ✅ ZIP archive created

**Windows Checks:**
- ✅ Unpacked app directory exists
- ✅ Main executable present
- ✅ NSIS installer created
- ✅ Portable exe created

**Result:** Builds fail immediately if any verification fails - no more broken binaries!

---

## 🔧 Fix for "Damaged App" Error

### The Problem
When you download and try to open GanttGen on macOS, you see:

```
"GanttGen.app" is damaged and can't be opened. You should move it to the Trash.
```

### The Solution (30 seconds)

**Open Terminal and run:**
```bash
xattr -cr /Applications/GanttGen.app
```

**That's it!** Try opening GanttGen again.

### Why This Works
- macOS marks downloaded apps with a "quarantine" flag
- Since GanttGen isn't code-signed, macOS blocks it
- `xattr -cr` removes the quarantine flag
- This is safe and commonly used by developers

### Alternative Method
1. Right-click on GanttGen.app
2. Select "Open"
3. Click "Open" in the dialog
4. (Only needed once)

---

## 📋 Build Verification Output

When builds run, you'll now see:

```
=== Verifying macOS build ===
✓ Found app bundle: dist/mac-arm64/GanttGen.app
✓ Main executable exists
✓ Info.plist exists
Architecture: arm64
✓ DMG file(s) found: 1
✓ ZIP file(s) found: 1
=== macOS build verification passed ===
```

If any check fails, the build stops with a clear error message.

---

## 📦 Updated Package Names

**macOS:**
- `GanttGen-0.5.0-arm64.dmg`
- `GanttGen-0.5.0-arm64-mac.zip`

**Windows:**
- `GanttGen-Setup-0.5.0.exe`
- `GanttGen-0.5.0-win.exe`

---

## 🚀 Next Build

The next time GitHub Actions runs, it will:
1. Build ARM64 only for macOS
2. Verify all files are correct
3. Fail immediately if anything is wrong
4. Upload verified binaries

---

## 📚 Full Documentation

- **macOS Issues:** [MACOS_TROUBLESHOOTING.md](MACOS_TROUBLESHOOTING.md)
- **Building:** [BUILDING.md](BUILDING.md)
- **GitHub Actions:** [../.github/workflows/README.md](../.github/workflows/README.md)

---

## Command Reference

### macOS
```bash
# Fix "damaged app" error
xattr -cr /Applications/GanttGen.app

# Check quarantine status
xattr -l /Applications/GanttGen.app

# Fix permissions
chmod -R 755 /Applications/GanttGen.app
```

### Local Testing
```bash
# Build for macOS (ARM64 only)
cd electron-app
npm run build:mac

# Build for Windows
npm run build:win

# Check what was built
ls -lh dist/
```

---

**All changes have been committed and pushed to:**
`claude/electron-installer-app-0188XCGqJJ2ob6oDXRmRgnQD`

The next build will use the new configuration!
