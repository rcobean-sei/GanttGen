#!/bin/bash

# Script to clear GanttGen app-specific dependencies only (Application Support/AppData)
# Usage: ./start-fresh.sh [--dry-run] [--execute]

set -e

DRY_RUN=false
EXECUTE=false

# Parse arguments
if [[ "$1" == "--dry-run" ]] || [[ "$1" == "-n" ]]; then
    DRY_RUN=true
    echo "🔍 DRY RUN MODE - Showing what would be removed (no changes will be made)"
    echo ""
elif [[ "$1" == "--execute" ]] || [[ "$1" == "-x" ]]; then
    EXECUTE=true
    echo "⚠️  EXECUTE MODE - This will permanently delete files!"
    echo "Press Ctrl+C within 5 seconds to cancel..."
    sleep 5
    echo ""
else
    echo "Usage: $0 [--dry-run|--execute]"
    echo ""
    echo "  --dry-run   Show what would be removed (default)"
    echo "  --execute   Actually remove the files"
    echo ""
    echo "Running in dry-run mode by default..."
    echo ""
    DRY_RUN=true
fi

REMOVED_COUNT=0
TOTAL_SIZE=0

# Function to remove file/directory
remove_item() {
    local item="$1"
    local description="$2"
    
    if [[ -e "$item" ]] || [[ -L "$item" ]]; then
        local size=$(du -sh "$item" 2>/dev/null | cut -f1 || echo "unknown")
        echo "  ❌ $description"
        echo "     Path: $item"
        echo "     Size: $size"
        
        if [[ "$EXECUTE" == true ]]; then
            if [[ -d "$item" ]]; then
                sudo rm -rf "$item" 2>/dev/null || rm -rf "$item" 2>/dev/null
            else
                sudo rm -f "$item" 2>/dev/null || rm -f "$item" 2>/dev/null
            fi
            echo "     ✅ Removed"
        fi
        
        REMOVED_COUNT=$((REMOVED_COUNT + 1))
    fi
}

# Focused GanttGen cleanup only
echo "=========================================="
echo "  GanttGen App Dependencies Cleanup"
echo "=========================================="
echo ""

# GanttGen app-specific dependencies
echo "📱 GanttGen app-specific dependencies"
GANTTGEN_APP_DATA="$HOME/Library/Application Support/com.sei.ganttgen"
if [[ -d "$GANTTGEN_APP_DATA" ]]; then
    echo "   Found GanttGen app data directory"
    remove_item "$GANTTGEN_APP_DATA/node" "GanttGen bundled Node.js + npm"
    remove_item "$GANTTGEN_APP_DATA/dependencies" "GanttGen dependencies (exceljs, playwright, sharp)"
    remove_item "$GANTTGEN_APP_DATA/dependencies/node_modules" "GanttGen node_modules"
    remove_item "$GANTTGEN_APP_DATA/dependencies/playwright-browsers" "Playwright browser runtime"
    remove_item "$GANTTGEN_APP_DATA/dependencies/package.json" "GanttGen package.json"
    remove_item "$GANTTGEN_APP_DATA/dependencies/package-lock.json" "GanttGen package-lock.json"
    
    # Optionally remove entire app data directory if empty or if user wants complete cleanup
    if [[ "$EXECUTE" == true ]] && [[ -d "$GANTTGEN_APP_DATA" ]]; then
        if [[ -z "$(ls -A "$GANTTGEN_APP_DATA" 2>/dev/null)" ]]; then
            remove_item "$GANTTGEN_APP_DATA" "Empty GanttGen app data directory"
        else
            echo "   ℹ️  App data directory contains other files, keeping it"
        fi
    fi
else
    echo "   ✅ No GanttGen app data directory found"
fi
echo ""

# Project-specific node_modules (showing only)
echo "📁 Project node_modules (showing locations, not removing by default)"
if [[ "$EXECUTE" == true ]] && [[ -n "$PWD" ]]; then
    if [[ -d "node_modules" ]]; then
        echo "   ⚠️  Found node_modules in current directory: $PWD"
        echo "   (Skipping - remove manually if needed)"
    fi
fi
echo ""

# Summary
echo "=========================================="
echo "  Summary"
echo "=========================================="
if [[ "$DRY_RUN" == true ]]; then
    echo "🔍 Found $REMOVED_COUNT items that would be removed"
    echo ""
    echo "To actually remove these items, run:"
    echo "  $0 --execute"
elif [[ "$EXECUTE" == true ]]; then
    echo "✅ Removed $REMOVED_COUNT items"
    echo ""
    echo "⚠️  Next steps:"
    echo "   1. Restart your terminal or run: source ~/.zshrc"
    echo "   2. Verify removal: which node (should return nothing)"
    echo "   3. If you want to reinstall, use nvm or the .pkg installer"
fi
echo ""

