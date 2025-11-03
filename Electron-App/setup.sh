#!/bin/bash

# Setup script for Peter Marker Electron App
# This script copies icons and installs dependencies

echo "🎨 Peter Marker - Setup Script"
echo "================================"
echo ""

# Check if we're in the Electron-App directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the Electron-App directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 2: Copy icon files
echo "🎨 Step 2: Setting up icons..."

# Check if Chrome extension icons exist
if [ ! -d "../Chrome-Extension/icons" ]; then
    echo "⚠️  Warning: Chrome extension icons not found at ../Chrome-Extension/icons"
    echo "   Please manually copy icon files to ./icons/"
else
    # Copy all PNG files
    cp ../Chrome-Extension/icons/*.png ./icons/
    if [ $? -eq 0 ]; then
        echo "✅ Copied icon files"
        
        # Create Mac tray icon
        cp ./icons/icon16.png ./icons/tray-icon-mac.png
        echo "✅ Created tray-icon-mac.png"
    else
        echo "❌ Failed to copy icons"
        exit 1
    fi
fi
echo ""

# Step 3: Verify setup
echo "🔍 Step 3: Verifying setup..."

# Check for required files
REQUIRED_FILES=("main.js" "renderer.js" "renderer.html" "preload.js" "styles.css" "package.json")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    echo "❌ Missing required files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

# Check for icon files
ICON_COUNT=$(ls -1 icons/*.png 2>/dev/null | wc -l)
if [ $ICON_COUNT -lt 5 ]; then
    echo "⚠️  Warning: Only $ICON_COUNT icon files found (expected at least 5)"
    echo "   Please copy icon files from Chrome-Extension/icons/ to ./icons/"
else
    echo "✅ Found $ICON_COUNT icon files"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm start' to test the app"
echo "  2. Run 'npm run build:mac' to build for Mac"
echo "  3. Run 'npm run build:win' to build for Windows"
echo ""
echo "📚 For more information, see:"
echo "  - QUICKSTART.md - Quick start guide"
echo "  - README.md - Complete documentation"
echo "  - BUILD_CHECKLIST.md - Building production installers"
echo ""
