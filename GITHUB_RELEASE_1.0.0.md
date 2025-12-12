# 🎉 GanttGen 1.0.0 - Initial Release

We're excited to announce the first official release of **GanttGen** - a simple, data-driven Gantt chart generator that creates presentation-ready HTML and PNG visualizations with minimal effort!

## ✨ Highlights

- **Works With What You Know**: Use familiar JSON or Excel (`.xlsx`) files
- **Two Formats, No Extra Work**: Get both interactive HTML and shareable PNG automatically
- **8 Ready-Made Color Schemes**: Just pick one - reds, purples, or alternating styles
- **Desktop App Available**: GUI option if you prefer not to use the command line
- **Start in Seconds**: Pre-built templates get you going immediately
- **Simple Yet Complete**: Drop shadows, project titles, milestones, pause periods, and task hierarchies - all easy to use

## 🚀 Quick Start

### CLI
```bash
npm install
node scripts/build.js --input templates/gantt_template.json --palette alternating
```

### Desktop App
```bash
npm run tauri:dev
```

## 📦 What's New in 1.0.0

- ✅ Simple build process (JSON/Excel → HTML/PNG in one command)
- ✅ 8 ready-to-use color palettes - just choose one
- ✅ Easy drop shadow toggle for visual depth
- ✅ Project titles display automatically
- ✅ Well-tested and reliable
- ✅ User-friendly desktop application
- ✅ Ready-made templates to start immediately
- ✅ Easy file conversion between JSON and Excel
- ✅ Clear documentation with examples

## 📋 Requirements

- Node.js 18.x or 20.x (if you have Node installed, you're good to go!)
- Chromium browser (installs automatically with `npm install`)
- Rust (only needed if building the desktop app yourself)

## 🐛 Known Issues

- Visual regression snapshots are platform-specific
- Excel files must follow the template schema

## 📚 Getting Started

- See `CLAUDE.md` for easy-to-follow instructions
- Copy and customize template files in the `templates/` directory
- Run `npm test` to verify everything works

## 🙏 Feedback

Found a bug or have a feature request? [Open an issue](https://github.com/rcobean-sei/GanttGen/issues)!

---

**Full Changelog**: Initial 1.0.0 release
