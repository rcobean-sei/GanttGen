# Feature: Pause Block Controls in Tauri Desktop App

## Issue Description

The unified `build.js` pipeline already supports `pausePeriods` that render diagonal "Pause Block" overlays and split task bars inside the HTML template. The Tauri desktop experience is missing any UI that lets users define, preview, or edit these pause windows, so every pause must be hard-coded in uploaded JSON/Excel files. Add first-class Pause Block tooling to the desktop app so users can inject these breaks from the manual-entry workflow while keeping styling consistent with the SEI palette system.

## Requirements

### User Experience
- Add a **Pause Blocks** card to the manual entry tab between Tasks and Milestones.
- Each pause block lets users pick `Start` and `End` dates, displays a short description, and includes remove controls that match existing pill buttons.
- Provide an empty-state explainer (same visual language as Tasks/Milestones) that references diagonal break overlays users already see in the generated charts.
- Include an "Add Pause Block" CTA that mirrors the Add Task button styling so the section stays on-brand.

### Technical
- Extend `state.manualData.pausePeriods` with `addPause`, `updatePause`, `removePause`, and `renderPausePeriods()` helpers inside `tauri-app/src/app.js`.
- Ensure JSON preview + manual-to-temp-file export contains the pause array so build.js receives it.
- Validate that each pause block has both dates and that `start <= end`; highlight invalid rows identically to other form errors.
- Persist pause data when switching between tabs / toggling JSON preview, and sync UI when user pastes JSON containing `pausePeriods`.
- Add SCSS/CSS to `tauri-app/src/styles.css` for the pause section, reusing the red/purple gradients & cream neutrals used elsewhere.

### Acceptance
- Manual mode can add/remove/edit multiple pause blocks and the JSON preview reflects them.
- Generated HTML from manual mode shows pause overlays (prove via screenshot or manual QA).
- Empty-state and controls match the SEI theme (creme background, burgundy text accents, rounded cards).

## Branch

`feature/tauri-pause-block`

## Implementation Plan

1. **Research / Wiring**
   - Confirm `manualData.pausePeriods` currently feeds JSON (it does) and document how build.js consumes it so QA knows what to look for.
   - Inventory existing empty-state + card components in `index.html/styles.css` so pause UI can reuse them.

2. **UI Skeleton**
   - Update `tauri-app/src/index.html` to insert the Pause Blocks section/call-to-action markup that mirrors Tasks/Milestones structure (header, add button, list container, empty-state copy).
   - Add corresponding CSS tokens (card spacing, date grid, remove icon) into `styles.css`, sticking to the red/purple palette variables to keep theming consistent.

3. **State + Rendering Logic**
   - In `app.js`, add render + mutation helpers for pause periods (mirroring `renderMilestones` patterns) including validation, input bindings, and event listeners.
   - When parsing user-provided JSON (manual editor), ensure pause data is ingested back into `state.manualData.pausePeriods`.
   - Hook `renderPausePeriods()` into initialization and whenever manual data changes.

4. **Validation + UX Polish**
   - Add inline validation (class toggles) when start/end missing or start > end; display small warning text matching existing styles.
   - Ensure Add button enforces timeline boundaries (auto default to timeline start/end or today's date if empty) so overlays align with chart.
   - Smoke-test manual generation => confirm `pausePeriods` appear in resulting HTML/PNG.

5. **Docs / QA Notes**
   - Update README or desktop usage notes (if any) to mention Pause Blocks, and capture manual testing steps/screenshots for reviewers.

## Testing

- Manual QA: add multiple pause blocks, toggle JSON preview, switch tabs, generate chart, verify overlays.
- Optional unit coverage: extend any existing UI helper tests (if/when introduced) or add a quick Jest dom-less test for pause rendering helpers.
