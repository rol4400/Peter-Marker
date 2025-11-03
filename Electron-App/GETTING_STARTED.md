# ✅ Getting Started Checklist

Follow this checklist to get Peter Marker Desktop running on your machine.

## Prerequisites
- [ ] Node.js 16+ installed ([Download here](https://nodejs.org/))
- [ ] Git installed (optional, for cloning)
- [ ] Terminal/PowerShell access

---

## Setup Steps

### ☑️ Step 1: Navigate to Project
```bash
cd Electron-App
```

### ☑️ Step 2: Run Setup Script

**Mac/Linux:**
```bash
bash setup.sh
```

**Windows PowerShell:**
```powershell
.\setup.ps1
```

**Or manually:**
```bash
# Install dependencies
npm install

# Copy icon files
# Mac/Linux:
cp ../Chrome-Extension/icons/*.png ./icons/
cp ./icons/icon16.png ./icons/tray-icon-mac.png

# Windows PowerShell:
Copy-Item ..\Chrome-Extension\icons\*.png .\icons\
Copy-Item .\icons\icon16.png .\icons\tray-icon-mac.png
```

### ☑️ Step 3: Start the App
```bash
npm start
```

---

## First Run Verification

After running `npm start`, verify:

- [ ] App window launches (may be invisible - that's normal!)
- [ ] Tray/menu bar icon appears
  - **Mac**: Look in menu bar (top-right)
  - **Windows**: Look in system tray (bottom-right)
- [ ] Click tray icon - pen icon should appear in bottom-right corner
- [ ] Click pen icon - toolbar should expand with color/eraser buttons
- [ ] Drawing works with mouse
- [ ] Color picker opens and changes color
- [ ] Eraser tool works
- [ ] Escape key closes drawing mode

---

## If Something Doesn't Work

### Node.js not found
```bash
# Check if Node.js is installed
node --version

# Should show v16.0.0 or higher
# If not, install from https://nodejs.org/
```

### npm install fails
```bash
# Try clearing npm cache
npm cache clean --force

# Remove node_modules and try again
rm -rf node_modules  # Mac/Linux
Remove-Item -Recurse -Force node_modules  # Windows

npm install
```

### Tray icon doesn't appear
- Check that icon files exist in `icons/` folder
- Should have at least: icon16.png, icon19.png, icon38.png, icon48.png, icon128.png, tray-icon-mac.png
- Try copying icon files manually from Chrome-Extension/icons/

### App won't stay on top (Mac)
1. Go to **System Preferences** → **Security & Privacy** → **Privacy**
2. Select **Accessibility** in the left sidebar
3. Click the lock icon and enter your password
4. Add or enable Electron/Peter Marker
5. Restart the app

### Window is completely invisible
- This is normal! The window is transparent
- Look for the tray/menu bar icon
- Click it to activate drawing mode
- The pen icon should appear in bottom-right

---

## Next Steps

Once the app is running:

### ☑️ Testing
- [ ] Test drawing over PowerPoint
- [ ] Test drawing over PDF viewer
- [ ] Test drawing over any application
- [ ] Test keyboard shortcuts (Cmd/Ctrl+Shift+D, Escape, arrows)
- [ ] Test touch input (if available)

### ☑️ Building for Distribution
- [ ] Read BUILD_CHECKLIST.md
- [ ] Create professional icons (optional)
- [ ] Build for your platform:
  ```bash
  npm run build:mac    # Mac
  npm run build:win    # Windows
  npm run build:all    # Both
  ```
- [ ] Test the installer on a clean machine

---

## Quick Reference

### Essential Commands
```bash
npm start              # Run in development
npm run build          # Build for current platform
npm run build:mac      # Build for Mac
npm run build:win      # Build for Windows
npm run build:all      # Build for all platforms
```

### Keyboard Shortcuts (When App is Running)
- `Cmd/Ctrl + Shift + D` - Toggle drawing mode
- `Escape` - Close drawing mode
- Arrow keys - Close drawing mode

### Tray Menu Options
- **Enable/Disable Drawing** - Toggle drawing overlay
- **Clear Canvas** - Remove all drawings
- **Quit Peter Marker** - Exit the app

---

## Documentation Reference

- **QUICKSTART.md** - Quick 3-step setup
- **README.md** - Complete documentation
- **BUILD_CHECKLIST.md** - Production build guide
- **COMPARISON.md** - Chrome vs Desktop comparison
- **PROJECT_SUMMARY.md** - Technical overview
- **SETUP_ICONS.md** - Icon setup details

---

## Success! 🎉

If you can see the tray icon and draw when clicking it, you're all set!

**What's next?**
- Use Peter Marker for teaching with PowerPoint/Keynote
- Build an installer to share with colleagues
- Read the full documentation for advanced features

---

**Need help?** Check README.md or BUILD_CHECKLIST.md for troubleshooting.
