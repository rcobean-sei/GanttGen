#!/bin/bash
# GanttGen - Remove Quarantine Script
# Double-click this script to fix the "damaged app" error

echo "════════════════════════════════════════════════"
echo "  GanttGen - Remove macOS Quarantine"
echo "════════════════════════════════════════════════"
echo ""
echo "This will remove the quarantine flag from GanttGen.app"
echo ""

# Check if GanttGen.app exists in Applications
if [ ! -d "/Applications/GanttGen.app" ]; then
    echo "❌ ERROR: GanttGen.app not found in /Applications/"
    echo ""
    echo "Please install GanttGen to /Applications first."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "Removing quarantine flag..."
xattr -cr /Applications/GanttGen.app

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! GanttGen is now ready to use."
    echo ""
    echo "You can now open GanttGen from Applications."
else
    echo ""
    echo "❌ ERROR: Could not remove quarantine flag."
    echo ""
    echo "Please run this command in Terminal manually:"
    echo "  xattr -cr /Applications/GanttGen.app"
fi

echo ""
echo "════════════════════════════════════════════════"
read -p "Press Enter to exit..."
