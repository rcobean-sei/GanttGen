# Gantt Chart Readability Recommendations for Screenshare Presentation

## Priority 1: Critical Improvements (Do These First)

### 1. Increase Font Sizes
- **Day ticks**: 9px → **11px** (22% increase)
- **Day numbers**: 10px → **12px** (20% increase)  
- **Subtask text**: 11px → **13px** (18% increase)
- **Task bar dates**: 12px → **14px** (17% increase)
- **Task bar hours**: 10px → **12px** (20% increase)
- **Milestone labels**: 11px → **13px** (18% increase)

### 2. Improve Text Contrast
- **Subtask text**: Change from #666 to **#555** (darker gray for better contrast)
- **Task bar text**: Ensure white text has sufficient contrast on colored backgrounds (currently good, but verify)

### 3. Increase Task Bar Padding
- **Current**: `padding: 4px 12px`
- **Recommended**: `padding: 6px 16px` (more breathing room for text)

## Priority 2: Visual Enhancements

### 4. Increase Grid Line Visibility
- **Current**: `rgba(0,0,0,0.08)` (very faint)
- **Recommended**: `rgba(0,0,0,0.12)` (50% more visible)
- **Week boundaries**: `rgba(0,0,0,0.2)` → `rgba(0,0,0,0.25)` (slightly more prominent)

### 5. Thicken Connector Lines
- **Current**: `--connector-width: 2px`
- **Recommended**: `--connector-width: 2.5px` or `3px` (more visible on screenshare)

### 6. Increase Task Row Height
- **Current**: `min-height: 60px`
- **Recommended**: `min-height: 70px` (more space for subtasks)

### 7. Increase Task Bar Height
- **Current**: `height: 50px`
- **Recommended**: `height: 55px` or `60px` (larger text area)

## Priority 3: Polish & Refinement

### 8. Increase Milestone Label Padding
- **Current**: `padding: 6px 10px`
- **Recommended**: `padding: 8px 12px` (more readable text)

### 9. Increase Month Label Font Size
- **Current**: `font-size: 14px`
- **Recommended**: `font-size: 15px` or `16px` (slightly more prominent)

### 10. Increase Task Name Font Size
- **Current**: `font-size: 15px`
- **Recommended**: `font-size: 16px` (better hierarchy)

### 11. Add Slight Letter Spacing to Task Names
- **Current**: No letter-spacing
- **Recommended**: `letter-spacing: 0.3px` (improves readability)

### 12. Increase Subtask Line Height
- **Current**: `line-height: 1.4`
- **Recommended**: `line-height: 1.5` (more breathing room)

## Additional Considerations

### 13. Consider Adding Subtle Drop Shadow to Task Bars
- Makes bars "pop" more on screenshare
- Current shadow is good, but could be slightly more pronounced

### 14. Ensure Title is Large Enough
- **Current**: 48px (good for screenshare)
- Consider: 52px if space allows

### 15. Test Color Contrast Ratios
- Ensure all text meets WCAG AA standards (4.5:1 for normal text)
- White text on colored bars should be verified

## Implementation Notes

- Test changes incrementally - don't change everything at once
- Screenshare compression may reduce quality, so slightly larger/bolder is better
- Consider that viewers may be on different screen sizes and resolutions
- The chart should be readable at 100% zoom, but also when zoomed out to fit screen

## Quick Win: Font Size Multiplier

A quick way to improve readability would be to add a CSS variable for a font-size multiplier:
```css
:root {
    --font-scale: 1.15; /* 15% increase across the board */
}
```
Then multiply all font sizes by this value. This maintains proportions while improving readability.

