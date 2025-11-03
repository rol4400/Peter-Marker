# Icons Setup

This directory contains the icons needed for the Peter Marker desktop application.

## Required Icons

### For Mac:
- `icon.icns` - Main application icon for macOS (required)
- `tray-icon-mac.png` - System tray icon for macOS (16x16 or 32x32, template style recommended)

### For Windows:
- `icon.ico` - Main application icon for Windows (required)
- `icon16.png` - System tray icon for Windows (16x16)

## Current Setup

The icon files from the Chrome extension have been copied here. You'll need to:

1. **Create icon.icns for Mac:**
   - Use an online converter or Mac tool like `iconutil` to convert PNG to ICNS
   - Recommended: Use the `icon128.png` or create a 1024x1024 version
   - Online tools: https://cloudconvert.com/png-to-icns

2. **Create icon.ico for Windows:**
   - Use an online converter to create a multi-resolution ICO file
   - Should include 16x16, 32x32, 48x48, 256x256 sizes
   - Online tools: https://icoconvert.com/ or https://convertio.co/png-ico/

3. **Create tray-icon-mac.png:**
   - For Mac, create a 16x16 or 32x32 monochrome/template icon
   - Should be black and white for best results with macOS dark/light modes
   - Can use a simplified version of the pen icon

## Quick Setup Commands

If you have ImageMagick installed, you can create the Windows icon:
```bash
magick convert icon128.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

For Mac, you can use the `sips` command to create an iconset:
```bash
# Create iconset directory structure
mkdir icon.iconset
sips -z 16 16 icon128.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon128.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon128.png --out icon.iconset/icon_32x32.png
sips -z 64 64 icon128.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon128.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon128.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon128.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon128.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon128.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon128.png --out icon.iconset/icon_512x512@2x.png

# Convert to icns
iconutil -c icns icon.iconset
```

## Note

The existing PNG files from the Chrome extension are available and can be used as source material for creating the required icon formats.
