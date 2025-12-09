# GitHub Actions - Tauri Build Guide

## 🚀 Automated Desktop Builds

This repository ships a **single Tauri workflow** (`.github/workflows/tauri-build.yml`) that packages the app for macOS and Windows. Every push, pull request, or manual dispatch can produce signed macOS DMGs and Windows installers ready for testing.

---

## 📦 Outputs

| Platform | Artifact | Notes |
|----------|----------|-------|
| **macOS** | `.dmg` installer | Apple Silicon target (`aarch64-apple-darwin`); signed & notarized when secrets exist |
| **Windows** | `.exe` (NSIS) + `.msi` | Built via `tauri-apps/tauri-action` on `windows-latest` |

Artifacts are uploaded with names like `GanttGen-macOS-arm64` or `GanttGen-Windows-x64` and include commit metadata when the build is not from a git tag.

---

## ⚡ Triggering Builds

### 1. Branch pushes / PRs

```
git checkout -b feature/my-change
# ...edit...
git commit -am "Add thing"
git push origin feature/my-change
```

Pushes to branches (and pull requests targeting `main`) automatically run the workflow for both platforms.

### 2. Tags / releases

```
git tag -a v1.2.3 -m "Release notes"
git push origin v1.2.3
```

Tagged commits run the same build but keep artifact names clean (no timestamp suffixes). Signed macOS builds are notarized when Apple credentials are configured.

### 3. Manual dispatch

1. Open **Actions → Tauri Build with Caching**
2. Click **Run workflow**
3. Choose branch and optional *Force rebuild* toggle
4. Run – handy for nightlies or retesting

---

## 📥 Downloading Artifacts

### From a workflow run

1. Actions → `Tauri Build with Caching`
2. Pick the desired run
3. Download `GanttGen-macOS-arm64` or `GanttGen-Windows-x64`

### From a draft/published release

Tagged builds create/upload platform installers under **Releases → Assets**. Grab DMG/MSI/EXE from there when validating release candidates.

---

## 🔄 Workflow Overview

```
push / PR / tag / manual
        │
        ▼
┌─────────────────────────────┐
│ Matrix job (macOS + Windows)│
├─────────────┬───────────────┤
│ macOS       │ Windows       │
│──────────── │────────────── │
│ checkout    │ checkout      │
│ detect tag  │ detect tag    │
│ restore cache│ restore cache│
│ install deps│ install deps  │
│ npm ci root │ npm ci root   │
│ npm ci scripts│             │
│ npm ci tauri │              │
│ brew install │              │
│ npm run tauri build         │
│ notarize/sign (if secrets)  │
│ rename artifacts (dev)      │
│ upload DMG                  │
│                tauri-action │
│                upload EXE/MSI│
└─────────────┴───────────────┘
```

Tagged builds skip the renaming steps while development builds append `_YYYYmmdd_HHMMSS_commit` to artifacts for traceability.

---

## ⏱️ Typical Duration

| Stage | Time |
|-------|------|
| Setup & caches | 1-2 min |
| npm installs (root/scripts/tauri) | 2-4 min |
| macOS build & signing | 5-8 min |
| Windows build | 4-6 min |
| Upload + notarization | 2-4 min |
| **Total** | ~15 min (runs in parallel) |

---

## 🔍 Monitoring + Logs

- Watch the colored status dots next to commits/PRs
- Drill into **Actions → run → job** to see each step
- macOS signing/notarization logs appear near the end of the job; Windows uses the `tauri-apps/tauri-action` step output

---

## 🛠️ Troubleshooting

### npm ci fails
- Ensure `package-lock.json` matches `package.json`
- Delete `node_modules` locally and run `npm ci` to reproduce
- Re-run workflow with *Force rebuild* if cache corruption is suspected

### Tauri build errors (macOS)
- Re-run with `Force rebuild` to avoid stale cache
- Confirm macOS code-signing secrets exist when signing is required
- Inspect `tauri-app/src-tauri/tauri.conf.json` for malformed metadata

### Windows `tauri-action` failures
- Ensure project builds locally: `cd tauri-app && npm install && npm run tauri build -- --target x86_64-pc-windows-msvc`
- Verify `tauri-app/src-tauri/tauri.conf.json` references valid icons/resources

---

## ✅ Before Pushing

1. `npm ci` at repo root (installs shared deps)
2. `npm ci` inside `tauri-app`
3. Optional: `npm run tauri dev` for smoke testing
4. `npm run test` / `npm run test:e2e` as needed

Clean local builds drastically reduce CI surprises.

---

## 🔐 Code Signing Notes

- macOS: requires `APPLE_SIGNING_IDENTITY`, certificate material, and optional notarization credentials (already supported in workflow)
- Windows: signing is handled externally today; artifacts remain unsigned installers

Update secrets under **Settings → Secrets and variables → Actions**.

---

## 🧩 Customizing the Workflow

Edit `.github/workflows/tauri-build.yml` to:
- Adjust matrix (add Intel mac targets, tweak Windows args)
- Modify caching keys / paths
- Toggle notarization bits
- Inject additional steps (linting, tests, notifications)

Remember to keep the release-detection step early in the job so later steps have commit/time metadata.

---

## 📚 Helpful Paths

- macOS DMG: `tauri-app/src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/`
- Windows installers: `tauri-app/src-tauri/target/release/bundle/`
- Workflow file: `.github/workflows/tauri-build.yml`

---

## 📝 Checklist

- [ ] Run tests locally
- [ ] Push branch & watch CI
- [ ] Download DMG/EXE artifacts for QA
- [ ] Tag for releases when ready
- [ ] Publish GitHub Release after validation

---

**Your Tauri app now builds automatically via GitHub Actions—no Electron pipeline required. Happy shipping!** 🚀
