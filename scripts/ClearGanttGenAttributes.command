#!/bin/bash

# Simple helper to clear macOS quarantine attributes from the installed GanttGen app bundle.
# This script is intended to be bundled alongside the DMG for double-click execution.

set -euo pipefail

APP_PATH="/Applications/GanttGen.app"

echo "---------------------------"
echo " GanttGen Attribute Cleaner"
echo "---------------------------"
echo ""

if [[ ! -d "${APP_PATH}" ]]; then
    echo "❌ Could not find ${APP_PATH}."
    echo "Please make sure GanttGen is installed in /Applications and try again."
    echo ""
    read -n 1 -s -r -p "Press Return to close this window."
    echo ""
    exit 1
fi

echo "Clearing extended attributes on ${APP_PATH}..."
if xattr -cr "${APP_PATH}"; then
    echo "✅ Quarantine attributes removed successfully."
else
    echo "⚠️  Failed to clear attributes. You may need to run this command manually with elevated privileges:"
    echo "    sudo xattr -cr \"${APP_PATH}\""
fi

echo ""
read -n 1 -s -r -p "Done! Press Return to close this window."
echo ""
