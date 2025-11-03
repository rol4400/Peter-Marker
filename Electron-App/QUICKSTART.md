# Quick Start Guide - Peter Marker Desktop

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

Open terminal in the `Electron-App` folder and run:

```bash
npm install
```

This will install Electron and all necessary packages.

### 2. Setup Icons

Copy the icon files from the Chrome extension:

**Option A - Manual Copy:**
- Copy all `.png` files from `Chrome-Extension/icons/` to `Electron-App/icons/`
- Duplicate `icon16.png` and rename the copy to `tray-icon-mac.png`

**Option B - Command Line (PowerShell on Windows):**
```powershell
Copy-Item ..\Chrome-Extension\icons\*.png .\icons\
Copy-Item .\icons\icon16.png .\icons\tray-icon-mac.png
```

**Option C - Command Line (Mac/Linux):**
```bash
cp ../Chrome-Extension/icons/*.png ./icons/
cp ./icons/icon16.png ./icons/tray-icon-mac.png
```

### 3. Run the App

```bash
npm start
```

That's it! Peter Marker should now be running. Look for the pen icon in your system tray/menu bar.

---

## 🎨 How to Use

1. **Click the tray icon** or press **`Cmd+Shift+D`** (Mac) / **`Ctrl+Shift+D`** (Windows)
2. Click the **pen icon** in the bottom-right corner
3. **Start drawing!** Use your mouse, stylus, or finger
4. Press **`Escape`** or **arrow keys** to exit drawing mode

---

## 📦 Building Installers

### For Mac (.dmg):
```bash
npm run build:mac
```

### For Windows (.exe):
```bash
npm run build:win
```

### For Both:
```bash
npm run build:all
```

Installers will be created in the `dist/` folder.

**Note:** You may need to create proper icon files (`.icns` for Mac, `.ico` for Windows) for production builds. See `icons/README.md` for details.

---

## 💡 Tips

- **Shortcuts work globally** - even when Peter Marker is in the background
- **Arrow keys close drawing mode** - perfect for advancing presentation slides
- **Right-click the tray icon** for more options like "Clear Canvas"
- **On Mac, the app auto-starts** on login (disable in System Preferences if needed)

---

## ⚠️ Troubleshooting

### "App won't stay on top"
- On Mac: Grant Accessibility permissions (System Preferences → Security & Privacy)
- Try restarting the app

### "Tray icon missing"
- Check if the icon files were copied correctly to `icons/` folder
- The icon might be in the overflow area - click the arrow to expand

### "npm install fails"
- Make sure you have Node.js 16 or higher installed
- Try deleting `node_modules` and running `npm install` again

---

## 📚 Need More Help?

See the full README.md for detailed documentation, troubleshooting, and advanced features.
