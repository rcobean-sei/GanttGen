# macOS Installation Troubleshooting

## "GanttGen.app is damaged and can't be opened"

This is the **most common issue** with unsigned macOS apps and is **easy to fix**.

### Why This Happens

When you download an app from the internet, macOS adds a "quarantine" flag to protect you from potentially harmful software. Since GanttGen is not code-signed by Apple, macOS blocks it.

### The Fix (30 seconds)

**Option 1: Remove Quarantine Flag (Recommended)**

1. **Open Terminal** (Applications → Utilities → Terminal)

2. **Copy and paste this command:**
   ```bash
   xattr -cr /Applications/GanttGen.app
   ```

3. **Press Enter**

4. **Try opening GanttGen again** - it should work now!

**Option 2: Right-Click Method**

1. **Right-click** (or Control+click) on GanttGen.app
2. Select **"Open"** from the menu
3. Click **"Open"** in the security dialog
4. This only needs to be done once

---

## Other macOS Issues

### "GanttGen can't be opened because Apple cannot check it for malicious software"

**Solution:** Use the right-click method above or run:
```bash
xattr -cr /Applications/GanttGen.app
```

### "GanttGen is from an unidentified developer"

**Solution:**
1. Go to **System Preferences → Security & Privacy**
2. Click **"Open Anyway"** next to the GanttGen message
3. Or use the xattr command above

### DMG won't mount

**Error:** "Image is damaged or corrupted"

**Solution:**
```bash
# Remove quarantine from DMG
xattr -cr ~/Downloads/GanttGen-*.dmg

# Try mounting again
open ~/Downloads/GanttGen-*.dmg
```

### App crashes on launch

**Check Console logs:**
1. Open **Console.app** (Applications → Utilities)
2. Search for "GanttGen"
3. Look for error messages

**Common causes:**
- Missing dependencies (Electron should be bundled)
- Permissions issue with app files
- macOS version incompatibility

**Try:**
```bash
# Reset all extended attributes
xattr -cr /Applications/GanttGen.app

# Check app permissions
ls -la /Applications/GanttGen.app/Contents/MacOS/
```

### "You do not have permission to open the application"

**Solution:**
```bash
# Fix permissions
chmod -R 755 /Applications/GanttGen.app
```

---

## Understanding macOS Security

### Why isn't GanttGen code-signed?

Code signing requires:
- Annual Apple Developer membership ($99/year)
- Developer certificate
- App notarization (sending app to Apple for scanning)

For an open-source testing release, we've skipped this to make it accessible to everyone immediately.

### Is it safe to bypass these warnings?

**Yes**, if you:
1. Downloaded from the official GitHub repository
2. Trust the source code (it's open source - you can review it)
3. Are comfortable with the `xattr` command (it just removes the quarantine flag)

The `xattr -cr` command is safe and commonly used by developers.

---

## Prevention for Future Updates

Once you've removed the quarantine flag, future updates to the same app location won't have this issue (unless you download a new version).

---

## Command Reference

### Remove quarantine from app
```bash
xattr -cr /Applications/GanttGen.app
```

### Remove quarantine from DMG
```bash
xattr -cr ~/Downloads/GanttGen-*.dmg
```

### Check quarantine status
```bash
xattr -l /Applications/GanttGen.app
```

### List all extended attributes
```bash
xattr -lr /Applications/GanttGen.app
```

### Fix permissions
```bash
chmod -R 755 /Applications/GanttGen.app
```

---

## Still Having Issues?

1. **Check macOS version:** Requires macOS 11.0+ (Big Sur or later)
2. **Check architecture:** This build is for Apple Silicon only (M1/M2/M3/M4)
   - Intel Macs are not supported in this build
3. **Check Console.app** for detailed error messages
4. **Create an issue** on GitHub with:
   - macOS version: `sw_vers`
   - Architecture: `uname -m`
   - Error messages from Console.app
   - Steps you've already tried

---

## For Developers: Future Code Signing

To sign future releases:

1. **Get Apple Developer Account**
   - Enroll at developer.apple.com
   - Cost: $99/year

2. **Create Developer ID Certificate**
   - In Xcode or via developer portal
   - Export as `.p12` file

3. **Update GitHub Secrets**
   - `CSC_LINK`: Base64-encoded certificate
   - `CSC_KEY_PASSWORD`: Certificate password
   - `APPLE_ID`: Your Apple ID email
   - `APPLE_ID_PASSWORD`: App-specific password

4. **Update Workflow**
   - Remove `CSC_IDENTITY_AUTO_DISCOVERY: false`
   - Add notarization step

5. **Build and Notarize**
   - electron-builder will automatically sign
   - Submit to Apple for notarization
   - Staple notarization ticket to app

Signed apps won't trigger these security warnings.
