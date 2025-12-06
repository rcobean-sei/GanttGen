#!/bin/bash
# Post-install script to help with macOS Gatekeeper
# This script is informational only - it runs inside the DMG environment

cat << 'EOF'

╔════════════════════════════════════════════════════════════════╗
║                    GanttGen Installation                       ║
╔════════════════════════════════════════════════════════════════╗

✓ GanttGen has been installed to /Applications

⚠️  IMPORTANT: First Launch Instructions

If you see "GanttGen is damaged and can't be opened":

1. Open Terminal (Applications → Utilities → Terminal)
2. Run this command:

   xattr -cr /Applications/GanttGen.app

3. Try opening GanttGen again

This is a one-time fix for unsigned apps on macOS.

Alternative: Right-click GanttGen.app → Open

For more help, visit:
https://github.com/rcobean-sei/GanttGen/blob/main/electron-app/MACOS_TROUBLESHOOTING.md

╚════════════════════════════════════════════════════════════════╝

EOF
