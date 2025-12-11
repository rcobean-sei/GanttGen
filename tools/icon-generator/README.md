# Icon Generator (SEI Gantt Icon)

This standalone module programmatically recreates the glossy, depth-heavy Gantt icon using SEI’s brand palette. The output PNG is generated with the [`canvas`](https://www.npmjs.com/package/canvas) library so every visual element (colors, gradients, spacing) can be tweaked via code or configuration files—making it easy to automate future adjustments.

## Requirements

- Node.js 18+
- Cairo (installed automatically on macOS via Canvas prebuilt; no extra setup expected)

## Usage

```bash
cd tools/icon-generator
npm install          # already done once in repo, run again if needed
npm run build        # generates output/icon.png
```

The script accepts optional config overrides:

```bash
# override layout settings
node generate-icon.js --config configs/windows.json --output output/icon-windows.png
```

- `--config` lets you supply layout overrides (see `configs/mac.json` and `configs/windows.json`).
- `--output` writes to a custom file so you can keep multiple variants side-by-side.

## Output

- Default: `output/icon.png`.
- Use `--output` to create named variants such as `output/icon-mac.png` or `output/icon-windows.png`.

## Structure

- `constants.js` — brand colors & layout defaults.
- `generate-icon.js` — renderer script (Node + canvas).
- `configs/mac.json` — macOS styling (flat background, no external drop shadow).
- `configs/windows.json` — Windows styling (adds an outer drop shadow).

This folder is detached from the main build (not imported by the Tauri app).
