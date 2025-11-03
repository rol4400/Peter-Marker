# Tray Icon Placeholder

For the Mac tray icon, copy one of the PNG files from the Chrome-Extension/icons folder:
- Use icon16.png as tray-icon-mac.png

For Windows, the icon16.png will work directly.

To copy the files, run these commands in PowerShell from the Electron-App directory:

```powershell
# Copy all icon files
Copy-Item ..\Chrome-Extension\icons\*.png .\icons\

# Create a copy for Mac tray icon
Copy-Item .\icons\icon16.png .\icons\tray-icon-mac.png
```

Or manually copy:
- Copy all PNG files from Chrome-Extension/icons/ to Electron-App/icons/
- Copy icon16.png and rename one copy to tray-icon-mac.png

For production builds, you'll also need to create:
- icon.icns for Mac (see icons/README.md)
- icon.ico for Windows (see icons/README.md)
