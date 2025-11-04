# Peter Marker

A simple and functional drawing tool for teachers using smartboards and touch displays. Draw over presentations, PDFs, and web pages during teaching sessions.

## 📦 Two Versions Available

### 🌐 Chrome Extension
Browser-based annotation tool for web pages.

**Best for:**
- Google Slides, Canva, web-based presentations
- Chromebooks
- Quick browser-based teaching

📁 **Location:** `Chrome-Extension/`

[View Chrome Extension README](Chrome-Extension/README.md) *(Create one if needed)*

---

### 💻 Desktop Application (Electron)
Native Mac and Windows app that works over any application.

**Best for:**
- Microsoft PowerPoint
- Apple Keynote  
- Native PDF viewers
- Any desktop application

📁 **Location:** `Electron-App/`

**Features:**
- ✏️ Draw over any application
- 🎨 Color picker with custom colors
- 🧹 Eraser tool
- 👆 Full touch and stylus support
- 🖥️ Always-on-top overlay
- ⚡ System tray/menu bar integration
- ⌨️ Global keyboard shortcuts
- 🚀 Auto-start on Mac

[View Desktop App Documentation →](Electron-App/README.md)

## 🚀 Quick Start

### Chrome Extension
1. Load extension in Chrome
2. Navigate to a webpage
3. Click the pen icon
4. Start drawing!

### Desktop App
1. Install Node.js (v16+)
2. Navigate to `Electron-App/`
3. Run setup script:
   ```bash
   # Mac/Linux
   bash setup.sh
   
   # Windows PowerShell
   .\setup.ps1
   ```
4. Run the app:
   ```bash
   npm start
   ```

**Or manually:**
```bash
cd Electron-App
npm install
# Copy icons from Chrome-Extension/icons/ to Electron-App/icons/
npm start
```

## 📖 Documentation

### Desktop App
- **[Quick Start Guide](Electron-App/QUICKSTART.md)** - Get started in 3 steps
- **[Complete README](Electron-App/README.md)** - Full documentation
- **[Build Checklist](Electron-App/BUILD_CHECKLIST.md)** - Production builds
- **[Comparison](Electron-App/COMPARISON.md)** - Chrome vs Desktop
- **[Project Summary](Electron-App/PROJECT_SUMMARY.md)** - Technical overview

### Chrome Extension
- Source files in `Chrome-Extension/`
- Manifest v3 extension
- Works on all URLs except YouTube

## 🎯 Which Version Should I Use?

| Scenario | Recommended Version |
|----------|-------------------|
| Web-based presentations (Google Slides, Canva) | **Chrome Extension** |
| Microsoft PowerPoint | **Desktop App** |
| Apple Keynote | **Desktop App** |
| PDF viewers | **Desktop App** |
| Chromebooks | **Chrome Extension** |
| Touch-enabled smartboard with native apps | **Desktop App** |
| Quick browser annotation | **Chrome Extension** |

**Pro Tip:** Install both! They work great together and cover all use cases.

## 🛠️ Building the Desktop App

### Prerequisites
- Node.js 16 or higher
- npm (comes with Node.js)

### Build Commands

```bash
cd Electron-App

# For Mac
npm run build:mac

# For Windows  
npm run build:win

# For both platforms
npm run build:all
```

**Output:**
- Mac: `.dmg` installer in `dist/`
- Windows: `.exe` installer in `dist/`

## ⚙️ Technical Details

### Chrome Extension
- Manifest V3
- Content script injection
- Canvas-based drawing
- Works on all web pages
- ~2MB installed size

### Desktop App (Electron)
- Electron 28+
- Transparent overlay window
- System-wide functionality
- System tray integration
- Auto-start capability (Mac)
- ~200-300MB installed size

## 🎓 Use Cases

Perfect for:
- 👨‍🏫 Teachers presenting on smartboards
- 📊 Business presentations with annotations
- 🎥 Live demonstrations and tutorials
- 📚 Online teaching and remote education
- 🖊️ Digital whiteboarding
- 📝 PDF annotation during meetings

## 📋 Features

### Drawing Tools
- ✏️ Freehand drawing
- 🎨 Custom color picker
- 🧹 Large eraser tool
- 📏 5px pen width / 100px eraser width
- 👆 Touch and stylus support
- ✋ Palm rejection (large touches = eraser)

### Controls
- 🖱️ Mouse, touch, and stylus input
- ⌨️ Keyboard shortcuts:
  - `Escape` - Exit drawing mode
  - Arrow keys - Exit drawing mode  
  - `Cmd/Ctrl + Shift + D` - Toggle (Desktop only)
- 🗑️ Clear canvas
- ↩️ Drawing history (undo support)

### Platform Integration (Desktop)
- 🍎 macOS menu bar integration
- 🪟 Windows system tray
- 🚀 Auto-launch on startup (Mac)
- 🌍 Global keyboard shortcuts
- 🔝 Always-on-top overlay

## 🐛 Known Limitations

### Chrome Extension
- Only works within browser windows
- Cannot annotate native applications
- Limited to web-based content
- Disabled on YouTube

### Desktop App
- Requires permissions on first launch (Mac: Accessibility, Screen Recording)
- Some exclusive full-screen apps may block overlay
- Larger file size (~100-150MB installer)
- May show security warning without code signing

## 🔒 Permissions

### Chrome Extension
- `activeTab` - Draw on the current webpage

### Desktop App (Mac)
- **Accessibility** - Stay on top of all windows
- **Screen Recording** - Overlay on all applications

### Desktop App (Windows)
- No special permissions required

## 📝 License

MIT License - Feel free to use, modify, and distribute.

## 🤝 Contributing

Contributions welcome! This project consists of:
1. Chrome extension (original version)
2. Electron desktop app (port of Chrome extension)

Both versions share similar UI and functionality.

## 💬 Support

For issues or questions:
- Check the relevant README files
- Review the documentation in `Electron-App/`
- Check build checklist for common build issues

## 🎉 Credits

Created for teachers using smartboards and touch-enabled displays to provide a simple, consistent way to annotate presentations regardless of the platform (web or native applications).

---

## Project Structure

```
Peter-Marker/
├── Chrome-Extension/          # Browser extension version
│   ├── manifest.json
│   ├── content.js
│   ├── styles.css
│   └── icons/
│
└── Electron-App/             # Desktop application version
    ├── main.js               # Main process
    ├── renderer.js           # Drawing logic
    ├── renderer.html         # UI
    ├── preload.js           # IPC bridge
    ├── styles.css           # Styling
    ├── package.json         # Config & dependencies
    ├── icons/               # App icons
    └── docs/                # Documentation
        ├── README.md
        ├── QUICKSTART.md
        ├── BUILD_CHECKLIST.md
        ├── COMPARISON.md
        └── PROJECT_SUMMARY.md
```

---

**Ready to get started?** Choose your version and follow the quick start guide above!
