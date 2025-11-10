# Peter Marker

Draw over presentations, PDFs, and web pages while teaching. Works with smartboards and touch displays.

## Two Versions

### Chrome Extension
Browser-based. Annotate web pages, Google Slides, Canva, etc.

Location: `Chrome-Extension/`

### Desktop App (Electron)
Native Mac/Windows app. Works over PowerPoint, Keynote, PDFs, or anything else.

Location: `Electron-App/`

Features:
- Draw over any application
- Color picker
- Eraser tool
- Touch and stylus support
- Always-on-top overlay
- System tray integration
- Keyboard shortcuts
- Auto-start on Mac

[Full documentation](Electron-App/README.md)

## Quick Start

### Chrome Extension
1. Load the extension in Chrome
2. Click the pen icon on any webpage
3. Draw

### Desktop App

Automated setup:
```bash
# Mac/Linux
bash setup.sh

# Windows PowerShell
.\setup.ps1
```

Manual setup:
```bash
cd Electron-App
npm install
# Copy icons from Chrome-Extension/icons/ to Electron-App/icons/
npm start
```

## Documentation

- [Quick Start Guide](Electron-App/QUICKSTART.md)
- [Complete README](Electron-App/README.md)
- [Build Checklist](Electron-App/BUILD_CHECKLIST.md)
- [Chrome vs Desktop Comparison](Electron-App/COMPARISON.md)
- [Technical Summary](Electron-App/PROJECT_SUMMARY.md)

## Which Version?

| Use Case | Version |
|----------|---------|
| Google Slides, Canva, web presentations | Chrome Extension |
| PowerPoint, Keynote, native apps | Desktop App |
| PDF viewers | Desktop App |
| Chromebooks | Chrome Extension |

Install both if you switch between web and native apps.

## Building

Requires Node.js 16+

```bash
cd Electron-App
npm run build:mac     # Mac .dmg
npm run build:win     # Windows .exe
npm run build:all     # Both
```

Builds output to `dist/`

## Technical Details

Chrome Extension: Manifest V3, ~2MB installed  
Desktop App: Electron 28+, transparent overlay, ~200-300MB installed

## Features

Drawing:
- Freehand pen (5px)
- Color picker
- Eraser (100px)
- Touch/stylus support
- Palm rejection

Controls:
- Escape/Arrow keys to exit
- Cmd/Ctrl+Shift+D to toggle (desktop)
- Clear canvas
- Undo support

Desktop only:
- Menu bar/system tray
- Auto-launch on startup
- Global shortcuts
- Always-on-top

## Known Issues

Chrome Extension:
- Browser only, can't annotate native apps
- Disabled on YouTube

Desktop App:
- Mac needs Accessibility and Screen Recording permissions on first launch
- Some fullscreen apps may block the overlay
- Large file size (~100-150MB installer)
- Unsigned builds show security warnings

## Permissions

Chrome: `activeTab` to draw on current page

Mac: Accessibility (stay on top), Screen Recording (overlay apps)

Windows: None

## License

MIT

## Contributing

This started as a Chrome extension and was ported to Electron for native app support. Both versions use the same UI and drawing logic.

## Project Structure

```
Peter-Marker/
├── Chrome-Extension/     # Browser extension
│   ├── manifest.json
│   ├── content.js
│   └── styles.css
│
└── Electron-App/        # Desktop app
    ├── main.js          # Main process
    ├── renderer.js      # Drawing logic
    ├── renderer.html
    ├── preload.js
    └── styles.css
```
