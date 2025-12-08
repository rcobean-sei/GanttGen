# Tauri App Feature Parity with Electron Version

**Type:** Enhancement / Bug Fix
**Priority:** High
**Component:** tauri-app

## Summary

The Tauri version of GanttGen has several feature gaps and bugs compared to the Electron version that need to be addressed for full feature parity.

## Issues Identified

### 1. Build Script Not Found Error (Critical Bug)

**Description:** When running the packaged Tauri app on macOS, clicking "Generate" throws an error:

```
Build script not found at: /Applications/GanttGen.app/Contents/Resources/scripts/build.js
```

**Root Cause:** The Tauri resource bundling configuration in `tauri.conf.json` uses relative paths:
```json
"resources": [
  "../../scripts/*",
  "../../templates/*"
]
```

The problem is that Tauri bundles resources with a flat structure, not preserving the directory hierarchy. The `get_scripts_dir()` function in `lib.rs` expects scripts to be in `Resources/scripts/` but the files are likely placed directly in `Resources/`.

**Files Involved:**
- `tauri-app/src-tauri/tauri.conf.json` (lines 38-41)
- `tauri-app/src-tauri/src/lib.rs` (lines 31-47)

**Proposed Fix:**
1. Change the resource bundling to preserve directory structure:
   ```json
   "resources": {
     "../../scripts": "scripts",
     "../../templates": "templates"
   }
   ```
2. Or update the Rust code to handle the flat resource structure

---

### 2. Missing SEI Logo (Feature Gap)

**Description:** The Tauri app header displays only text "GanttGen" without the SEI logo. The logo asset exists at `assets/sei_logo.svg` but is not included in the UI.

**Note:** The Electron version also lacks this logo in the header, but the expectation is that both versions should display SEI branding.

**Files Involved:**
- `assets/sei_logo.svg` (existing asset)
- `tauri-app/src/index.html` (needs logo integration)
- `tauri-app/src/styles.css` (needs logo styling)
- `tauri-app/src-tauri/tauri.conf.json` (needs to bundle the asset)

**Proposed Fix:**
1. Add SEI logo to the header alongside the "GanttGen" text
2. Bundle the `sei_logo.svg` asset in Tauri resources
3. Add appropriate CSS styling for the logo display

---

### 3. Missing Manual Data Entry (Feature Gap)

**Description:** Both Electron and Tauri versions only support file-based input (.json, .xlsx). There is no way to manually enter or edit task data directly in the UI.

**Proposed Feature:**
1. Add a "Manual Entry" tab/mode alongside the file upload
2. Provide form fields for entering:
   - Project metadata (title, start date, end date)
   - Tasks (name, start, end, hours, color)
   - Subtasks
   - Milestones (name, date)
   - Pause periods (start, end)
3. Generate JSON from manual entry for processing
4. Allow editing of loaded JSON/Excel data before generation

**Files Involved:**
- `tauri-app/src/index.html` (add manual entry UI)
- `tauri-app/src/app.js` (add manual entry logic)
- `tauri-app/src/styles.css` (add manual entry styling)
- `tauri-app/src-tauri/src/lib.rs` (add JSON generation command if needed)

---

## Implementation Priority

1. **High:** Build script path error (blocking - users cannot generate charts)
2. **Medium:** SEI logo integration (branding requirement)
3. **Medium:** Manual data entry (usability enhancement)

## Testing Checklist

- [ ] Build script executes successfully on macOS packaged app
- [ ] Build script executes successfully on Windows packaged app
- [ ] Build script executes successfully on Linux packaged app
- [ ] SEI logo displays correctly in header
- [ ] Manual data entry creates valid JSON structure
- [ ] Generated charts from manual entry match file-based generation

## Related Files

### Electron Reference Implementation
- `electron-app/src/main.js` - Script path resolution (lines 165-173)
- `electron-app/package.json` - Resource bundling config (lines 31-63)

### Tauri Implementation
- `tauri-app/src-tauri/src/lib.rs` - Backend commands
- `tauri-app/src-tauri/tauri.conf.json` - Build configuration
- `tauri-app/src/index.html` - Frontend UI
- `tauri-app/src/app.js` - Frontend logic

### Shared Assets
- `assets/sei_logo.svg` - SEI logo
- `scripts/build.js` - Main build script
- `templates/` - Template files
