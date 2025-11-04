# Peter Marker - Desktop Application

A desktop annotation tool for Mac and Windows that allows teachers to draw over PowerPoint presentations and any other application. Perfect for smartboards and touch-enabled displays.

## Features

- ✏️ **Draw over any application** - Works on top of PowerPoint, Keynote, PDFs, and any desktop application
- 🎨 **Color picker** - Choose any color for your annotations
- 🧹 **Eraser tool** - Remove unwanted marks with a large eraser
- 👆 **Touch-enabled** - Full support for stylus and touch input
- 🖥️ **Always on top** - Overlay stays above all windows
- 🚀 **Auto-start** - Launches automatically on system startup (Mac)
- 🎯 **System tray** - Easy access from menu bar/system tray
- ⌨️ **Keyboard shortcuts** - Quick toggle with keyboard shortcuts
- 🔄 **Automatic updates** - Stay up-to-date with the latest features via GitHub releases
- 🖥️ **Multi-monitor support** - Pen follows your cursor across multiple displays

## Installation

### Prerequisites

1. Install Node.js (v16 or higher): https://nodejs.org/
2. Clone or download this repository

### Setup

1. Open a terminal in the `Electron-App` directory
2. Install dependencies:

```bash
npm install
```

3. Copy icon files (see SETUP_ICONS.md for details):

```bash
# From Electron-App directory
cd icons
# Copy PNG files from Chrome extension manually
# Or run:
Copy-Item ..\Chrome-Extension\icons\*.png .
Copy-Item .\icon16.png .\tray-icon-mac.png
```

## Development

### Running the App

To run the app in development mode:

```bash
npm start
```

This will launch Peter Marker as an overlay on your screen.

## Building

### Build for Mac

```bash
npm run build:mac
```

This creates a `.dmg` installer in the `dist` folder.

**Mac Requirements:**
- Must be run on macOS
- May need to create `icon.icns` file (see icons/README.md)

### Build for Windows

```bash
npm run build:win
```

This creates a `.exe` installer in the `dist` folder.

**Windows Requirements:**
- Can be run on Windows or Mac (with wine)
- May need to create `icon.ico` file (see icons/README.md)

### Build for Both Platforms

```bash
npm run build:all
```

Note: Building for Mac from Windows or vice versa may require additional setup.

## Usage

### Starting the App

After installation, Peter Marker will:
- **Mac**: Auto-start and appear in the menu bar
- **Windows**: Launch and appear in the system tray

### Using Peter Marker

1. **Enable Drawing Mode**:
   - Click the tray/menu bar icon, OR
   - Press `Cmd/Ctrl + Shift + D`

2. **Drawing**:
   - A pen icon appears in the bottom-right corner
   - Click the pen icon to activate drawing mode
   - Draw with your mouse, stylus, or finger

3. **Tools**:
   - **Pen**: Toggle drawing mode on/off
   - **Color**: Click to choose a color
   - **Eraser**: Toggle eraser mode for removing marks

4. **Disable Drawing**:
   - Press `Escape` key
   - Press arrow keys (Left, Right, Up, Down, PageUp, PageDown)
   - Click the X icon in the bottom-right corner
   - Use the tray/menu bar menu

5. **Clear All Drawings**:
   - Right-click the tray/menu bar icon
   - Select "Clear Canvas"

6. **Check for Updates**:
   - Right-click the tray/menu bar icon
   - Select "Check for Updates"
   - App also checks automatically on startup

### Keyboard Shortcuts

- `Cmd/Ctrl + Shift + D` - Toggle drawing mode
- `Escape` - Exit drawing mode
- Arrow keys - Exit drawing mode (useful for presentations)

## Auto-Start Configuration

### Mac
The app automatically configures itself to launch at login. To disable:
1. Go to System Preferences → Users & Groups → Login Items
2. Remove "Peter Marker" from the list

### Windows
To enable auto-start on Windows:
1. Press `Win + R`
2. Type `shell:startup` and press Enter
3. Create a shortcut to Peter Marker in this folder

## System Requirements

### Mac
- macOS 10.13 (High Sierra) or later
- Works on Apple Silicon (M1/M2/M3) and Intel Macs

### Windows
- Windows 10 or later
- 64-bit or 32-bit versions available

## Troubleshooting

### App won't stay on top
- Try restarting the app
- On Mac, grant Accessibility permissions in System Preferences → Security & Privacy → Privacy → Accessibility

### Can't draw over certain applications
- Some full-screen applications may block overlays
- Try running the app with administrator privileges (Windows)
- On Mac, grant Screen Recording permissions in System Preferences → Security & Privacy → Privacy → Screen Recording

### Tray icon not appearing
- Make sure the app is running (check Activity Monitor/Task Manager)
- The icon may be hidden in the overflow area - click the arrow to expand

### Build errors
- Make sure all dependencies are installed: `npm install`
- Check that Node.js version is 16 or higher: `node --version`
- For Mac builds, ensure you have Xcode Command Line Tools installed
- For Windows builds, you may need to install Windows Build Tools

## Development Notes

### Project Structure

```
Electron-App/
├── main.js              # Main Electron process
├── preload.js           # Preload script for IPC
├── renderer.html        # Overlay UI
├── renderer.js          # Drawing logic
├── styles.css           # Styling
├── package.json         # Dependencies and build config
├── icons/               # App and tray icons
└── entitlements.mac.plist  # Mac security entitlements
```

### Technology Stack

- **Electron**: Desktop application framework
- **electron-builder**: Packaging and distribution
- **electron-updater**: Automatic updates via GitHub releases
- **HTML5 Canvas**: Drawing functionality
- **System Tray/Menu Bar**: Native OS integration

### Key Features Implementation

1. **Transparent Overlay**: Uses Electron's `transparent: true` and `alwaysOnTop` options
2. **Click-through**: Uses `setIgnoreMouseEvents()` to allow clicks to pass through when not drawing
3. **System Tray**: Uses Electron's `Tray` API for menu bar/system tray integration
4. **Auto-start**: Uses `app.setLoginItemSettings()` on Mac
5. **Global Shortcuts**: Uses `globalShortcut` API for keyboard shortcuts
6. **Auto-updates**: Uses electron-updater to check and install updates from GitHub releases
7. **Multi-monitor**: Uses Electron's `screen` API to track cursor position across displays

## Documentation

Detailed documentation is available in the following files:

- **[AUTO_UPDATE.md](AUTO_UPDATE.md)** - Automatic update setup and publishing releases
- **[MULTI_MONITOR.md](MULTI_MONITOR.md)** - Multi-monitor support details
- **[FULLSCREEN_HANDLING.md](FULLSCREEN_HANDLING.md)** - Fullscreen positioning behavior
- **[CLICK_THROUGH_FIX.md](CLICK_THROUGH_FIX.md)** - Click-through implementation details
- **[QUICKSTART.md](QUICKSTART.md)** - Quick 3-step setup guide
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Detailed setup checklist
- **[BUILD_CHECKLIST.md](BUILD_CHECKLIST.md)** - Production build guide
- **[SETUP_ICONS.md](SETUP_ICONS.md)** - Icon setup instructions
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Technical overview

## Contributing

This is a port of the Peter Marker Chrome extension. The core drawing functionality has been adapted from the browser-based version to work as a native desktop overlay.

## License

MIT

## Support

For issues or questions, please refer to the original Chrome extension documentation or create an issue in the repository.
