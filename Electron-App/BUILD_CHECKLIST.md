# Build Checklist - Peter Marker Desktop

Use this checklist before building production installers.

## Pre-Build Checklist

### ✅ 1. Dependencies Installed
```bash
npm install
```
Verify `node_modules` folder exists.

### ✅ 2. Icon Files Ready

**Required Files in `icons/` folder:**
- [ ] `icon16.png` (copied from Chrome extension)
- [ ] `icon19.png` (copied from Chrome extension)
- [ ] `icon38.png` (copied from Chrome extension)
- [ ] `icon48.png` (copied from Chrome extension)
- [ ] `icon128.png` (copied from Chrome extension)
- [ ] `tray-icon-mac.png` (copy of icon16.png)

**Optional for Professional Builds:**
- [ ] `icon.icns` (Mac application icon - 1024x1024 base)
- [ ] `icon.ico` (Windows application icon - multi-size)

### ✅ 3. Test in Development
```bash
npm start
```

**Test these features:**
- [ ] App launches successfully
- [ ] Tray/menu bar icon appears
- [ ] Clicking tray icon toggles drawing mode
- [ ] Pen icon appears in bottom-right corner
- [ ] Drawing works with mouse
- [ ] Drawing works with touch (if available)
- [ ] Color picker opens and changes color
- [ ] Eraser mode works
- [ ] Clear canvas works (right-click tray → Clear Canvas)
- [ ] Escape key closes drawing mode
- [ ] Arrow keys close drawing mode
- [ ] Global shortcut (Cmd/Ctrl+Shift+D) toggles drawing

### ✅ 4. Update Version (Optional)
Edit `package.json` and update version number:
```json
"version": "1.0.0"  // Change to 1.0.1, 1.1.0, etc.
```

### ✅ 5. Clean Previous Builds
```bash
# Remove old build files
rm -rf dist/
# or on Windows PowerShell:
Remove-Item -Recurse -Force dist/
```

## Building

### For Mac Development Build
```bash
npm run build:mac
```

**Expected Output:**
- `dist/Peter Marker-1.0.0.dmg`
- `dist/Peter Marker-1.0.0-arm64.dmg` (Apple Silicon)
- `dist/Peter Marker-1.0.0-x64.dmg` (Intel)

**Size:** ~100-150 MB per file

### For Windows Development Build
```bash
npm run build:win
```

**Expected Output:**
- `dist/Peter Marker Setup 1.0.0.exe`

**Size:** ~80-120 MB

### For Both Platforms
```bash
npm run build:all
```

## Post-Build Checklist

### ✅ 1. Verify Build Files
- [ ] Check `dist/` folder for installer files
- [ ] File sizes look reasonable (not too small or too large)
- [ ] File names include correct version number

### ✅ 2. Test Installation (Critical!)

**Mac:**
- [ ] Open the .dmg file
- [ ] Drag app to Applications folder
- [ ] Launch from Applications
- [ ] Grant required permissions (Accessibility, Screen Recording)
- [ ] Test all features
- [ ] Check auto-start works
- [ ] Verify tray icon appears
- [ ] Test drawing over PowerPoint/Keynote

**Windows:**
- [ ] Run the .exe installer
- [ ] Follow installation wizard
- [ ] Launch from Start Menu
- [ ] Test all features
- [ ] Verify tray icon appears
- [ ] Test drawing over PowerPoint

### ✅ 3. Test on Clean Machine (Recommended)
- [ ] Test on a computer that hasn't had the app installed before
- [ ] Verify no dependencies are missing
- [ ] Check installation is smooth for end users

## Known Build Issues & Solutions

### Issue: "Cannot find module 'electron'"
**Solution:** Run `npm install` first

### Issue: Mac build fails with code signing error
**Solution:** Add to `package.json` build config:
```json
"mac": {
  "identity": null
}
```
Or sign the app properly with an Apple Developer certificate.

### Issue: Windows build fails
**Solution:** 
- Ensure you have Windows Build Tools installed
- Run `npm install --global windows-build-tools` (may require admin)
- Or use WSL2 on Linux/Mac

### Issue: Build is very large (>200 MB)
**Normal:** Electron apps include a full Chromium browser, so 80-150 MB is typical.

### Issue: Icons don't appear in built app
**Solution:** 
- Verify icon files are in `icons/` folder
- Check `package.json` build config includes icons in `files` array
- Rebuild after fixing

## Distribution Checklist

### ✅ 1. Prepare for Distribution
- [ ] Test installers on multiple machines
- [ ] Create release notes
- [ ] Prepare screenshots/documentation
- [ ] Update README with download instructions

### ✅ 2. Mac Code Signing (Optional but Recommended)
For distribution outside of App Store:
- [ ] Get Apple Developer account ($99/year)
- [ ] Create Developer ID certificate
- [ ] Sign the app with your certificate
- [ ] Notarize the app with Apple

Without signing, users will need to bypass Gatekeeper:
- Right-click app → Open (first time only)

### ✅ 3. Windows Code Signing (Optional but Recommended)
For professional distribution:
- [ ] Get code signing certificate
- [ ] Sign the installer

Without signing, Windows SmartScreen may show a warning on first run.

### ✅ 4. Upload and Share
- [ ] Upload installers to your distribution platform
- [ ] Provide clear installation instructions
- [ ] Include system requirements
- [ ] Provide screenshots/video demo

## Quick Build Commands Reference

```bash
# Install dependencies
npm install

# Run in development
npm start

# Build for current platform
npm run build

# Build for Mac only
npm run build:mac

# Build for Windows only
npm run build:win

# Build for all platforms
npm run build:all

# Clean build folder
rm -rf dist/  # Mac/Linux
Remove-Item -Recurse -Force dist/  # Windows PowerShell
```

## Support

If you encounter build issues:
1. Check Node.js version: `node --version` (should be 16+)
2. Check npm version: `npm --version` (should be 8+)
3. Try deleting `node_modules` and running `npm install` again
4. Check electron-builder logs in `dist/` folder
5. Search electron-builder documentation: https://www.electron.build/

## Final Notes

- **First build takes longer** - Electron needs to download platform-specific binaries
- **Subsequent builds are faster** - Cached binaries are reused
- **Cross-platform builds** - Building Mac apps from Windows (or vice versa) may require additional configuration
- **Auto-updates** - Consider implementing electron-updater for automatic updates in future versions

---

**Ready to build?** Run `npm run build:mac` or `npm run build:win` and follow the post-build checklist!
