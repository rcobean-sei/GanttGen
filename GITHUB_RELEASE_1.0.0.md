# 🎉 GanttGen 1.0.0 - Initial Release

We're excited to announce the first official release of **GanttGen** - a powerful, data-driven Gantt chart generator that creates presentation-ready HTML and PNG visualizations!

## ✨ Highlights

- **Multiple Input Formats**: JSON and Excel (`.xlsx`) support
- **Dual Output**: Interactive HTML and high-quality PNG exports
- **8 Built-in Color Palettes**: Professional color schemes including reds, purples, and alternating styles
- **Desktop Application**: Full-featured Tauri-based GUI
- **Template System**: Get started instantly with pre-built templates
- **Advanced Features**: Drop shadows, project titles, milestones, pause periods, and task hierarchies

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

- ✅ Complete build pipeline (JSON/Excel → HTML/PNG)
- ✅ 8 professional color palette presets
- ✅ Drop shadow effects for visual depth
- ✅ Project title rendering in chart headers
- ✅ Comprehensive test suite (unit, integration, E2E, visual regression)
- ✅ Tauri desktop application
- ✅ Template generation and conversion tools
- ✅ CI/CD with GitHub Actions
- ✅ Full documentation and examples

## 📋 Requirements

- Node.js 18.x or 20.x
- Chromium (auto-installed via Playwright)
- Rust (for desktop app builds)

## 🐛 Known Issues

- Visual regression snapshots are platform-specific
- Excel files must follow the template schema

## 📚 Documentation

- See `CLAUDE.md` for comprehensive usage guide
- Check `templates/` directory for example files
- Run `npm test` to verify your installation

## 🙏 Feedback

Found a bug or have a feature request? [Open an issue](https://github.com/rcobean-sei/GanttGen/issues)!

---

**Full Changelog**: Initial 1.0.0 release
