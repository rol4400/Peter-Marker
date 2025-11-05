#!/bin/bash
# Clean macOS extended attributes before code signing

echo "Cleaning macOS extended attributes..."

# Remove extended attributes from dist folder if it exists
if [ -d "dist" ]; then
    echo "Removing extended attributes from dist folder..."
    xattr -cr dist
fi

# Remove extended attributes from node_modules if it exists
if [ -d "node_modules/electron" ]; then
    echo "Removing extended attributes from electron..."
    xattr -cr node_modules/electron
fi

echo "✓ Extended attributes cleaned"
