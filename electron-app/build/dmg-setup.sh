#!/bin/bash
# DMG setup script - creates a nice README inside the DMG

cat > "How to Install.txt" << 'EOF'
GanttGen for macOS
==================

INSTALLATION
------------
1. Drag GanttGen to the Applications folder
2. Eject this disk image


FIRST LAUNCH FIX
----------------
If macOS says "GanttGen is damaged and can't be opened":

  1. Open Terminal (Applications → Utilities → Terminal)

  2. Copy and paste this command:

     xattr -cr /Applications/GanttGen.app

  3. Press Enter

  4. Try opening GanttGen again


WHY THIS HAPPENS
----------------
GanttGen is not code-signed with an Apple Developer certificate.
macOS blocks unsigned apps for security. The command above removes
the quarantine flag and is completely safe.


ALTERNATIVE METHOD
------------------
Right-click on GanttGen.app → select "Open" → click "Open"
(Only needed once)


SYSTEM REQUIREMENTS
-------------------
• macOS 11.0 or later
• Apple Silicon Mac (M1/M2/M3/M4)
• Intel Macs are not supported


HELP & DOCUMENTATION
--------------------
GitHub: https://github.com/rcobean-sei/GanttGen
Troubleshooting: See MACOS_TROUBLESHOOTING.md

EOF
