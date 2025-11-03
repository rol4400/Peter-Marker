# Setup script for Peter Marker Electron App (Windows PowerShell)
# This script copies icons and installs dependencies

Write-Host "🎨 Peter Marker - Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the Electron-App directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the Electron-App directory" -ForegroundColor Red
    exit 1
}

# Step 1: Install dependencies
Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Copy icon files
Write-Host "🎨 Step 2: Setting up icons..." -ForegroundColor Yellow

# Check if Chrome extension icons exist
if (-not (Test-Path "..\Chrome-Extension\icons")) {
    Write-Host "⚠️  Warning: Chrome extension icons not found at ..\Chrome-Extension\icons" -ForegroundColor Yellow
    Write-Host "   Please manually copy icon files to .\icons\" -ForegroundColor Yellow
} else {
    # Copy all PNG files
    Copy-Item "..\Chrome-Extension\icons\*.png" ".\icons\" -Force
    if ($LASTEXITCODE -eq 0 -or $?) {
        Write-Host "✅ Copied icon files" -ForegroundColor Green
        
        # Create Mac tray icon
        Copy-Item ".\icons\icon16.png" ".\icons\tray-icon-mac.png" -Force
        Write-Host "✅ Created tray-icon-mac.png" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to copy icons" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 3: Verify setup
Write-Host "🔍 Step 3: Verifying setup..." -ForegroundColor Yellow

# Check for required files
$requiredFiles = @("main.js", "renderer.js", "renderer.html", "preload.js", "styles.css", "package.json")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing required files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    exit 1
}

# Check for icon files
$iconCount = (Get-ChildItem "icons\*.png" -ErrorAction SilentlyContinue).Count
if ($iconCount -lt 5) {
    Write-Host "⚠️  Warning: Only $iconCount icon files found (expected at least 5)" -ForegroundColor Yellow
    Write-Host "   Please copy icon files from Chrome-Extension\icons\ to .\icons\" -ForegroundColor Yellow
} else {
    Write-Host "✅ Found $iconCount icon files" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run 'npm start' to test the app"
Write-Host "  2. Run 'npm run build:mac' to build for Mac"
Write-Host "  3. Run 'npm run build:win' to build for Windows"
Write-Host ""
Write-Host "📚 For more information, see:" -ForegroundColor Cyan
Write-Host "  - QUICKSTART.md - Quick start guide"
Write-Host "  - README.md - Complete documentation"
Write-Host "  - BUILD_CHECKLIST.md - Building production installers"
Write-Host ""
