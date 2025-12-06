═══════════════════════════════════════════════════════════════
                   GanttGen for macOS
═══════════════════════════════════════════════════════════════

QUICK START
-----------
1. Drag GanttGen to the Applications folder
2. Eject this disk image
3. Open GanttGen from Applications


⚠️  IF YOU SEE "DAMAGED AND CAN'T BE OPENED"
--------------------------------------------

This is normal for unsigned apps. Here's the quick fix:

1. Open Terminal (Applications → Utilities → Terminal)

2. Copy and paste this command:

   xattr -cr /Applications/GanttGen.app

3. Press Enter and try opening GanttGen again


ALTERNATIVE FIX
---------------
• Right-click on GanttGen.app
• Select "Open" from the menu
• Click "Open" in the security dialog
• (Only needed once)


WHY THIS HAPPENS
----------------
GanttGen is not code-signed with an Apple Developer certificate.
macOS adds a "quarantine" flag to protect you from unsigned apps.
The xattr command removes this flag and is completely safe.


SYSTEM REQUIREMENTS
-------------------
• macOS 11.0 (Big Sur) or later
• Apple Silicon Mac (M1, M2, M3, or M4)
• Note: Intel Macs are NOT supported


FEATURES
--------
• Generate professional Gantt charts from JSON or Excel
• 7 SEI-branded color palettes
• Export to interactive HTML or high-resolution PNG
• Clean, modern interface


HELP & SUPPORT
--------------
Documentation: https://github.com/rcobean-sei/GanttGen
Troubleshooting: See MACOS_TROUBLESHOOTING.md in the repository
Issues: https://github.com/rcobean-sei/GanttGen/issues


═══════════════════════════════════════════════════════════════
            Thank you for using GanttGen!
═══════════════════════════════════════════════════════════════
