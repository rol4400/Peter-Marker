const { app, BrowserWindow, Tray, Menu, screen, ipcMain, globalShortcut, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;
let catchWindow; // Invisible window to catch clicks on pen icon area
let tray;
let isDrawingEnabled = false;

// Display locking
let lockedDisplayId = null; // null means auto-follow cursor
const SETTINGS_FILE = path.join(app.getPath('userData'), 'display-settings.json');

// Load display settings
function loadDisplaySettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
            const settings = JSON.parse(data);
            lockedDisplayId = settings.lockedDisplayId || null;
            console.log('Loaded display settings:', settings);
        }
    } catch (err) {
        console.error('Failed to load display settings:', err);
    }
}

// Save display settings
function saveDisplaySettings() {
    try {
        const settings = { lockedDisplayId };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        console.log('Saved display settings:', settings);
    } catch (err) {
        console.error('Failed to save display settings:', err);
    }
}

// Get the target display based on lock settings
function getTargetDisplay() {
    if (lockedDisplayId !== null) {
        // Try to find the locked display
        const displays = screen.getAllDisplays();
        const lockedDisplay = displays.find(d => d.id === lockedDisplayId);
        if (lockedDisplay) {
            return lockedDisplay;
        }
        // If locked display not found, fall back to cursor position
        console.log(`Locked display ${lockedDisplayId} not found, falling back to cursor`);
    }
    // Auto mode: follow cursor
    const cursorPoint = screen.getCursorScreenPoint();
    return screen.getDisplayNearestPoint(cursorPoint);
}

// Set display lock
function setDisplayLock(displayId) {
    lockedDisplayId = displayId;
    saveDisplaySettings();
    updateTrayMenu();
    // Immediately update window position to locked display
    if (displayId !== null) {
        const displays = screen.getAllDisplays();
        const targetDisplay = displays.find(d => d.id === displayId);
        if (targetDisplay) {
            updateWindowToDisplay(targetDisplay);
        }
    }
}

// Configure auto-updater
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false; // Prompt user before downloading
autoUpdater.autoInstallOnAppQuit = false; // Install immediately after download

function createWindow() {
    // Get primary display for initial window creation
    const primaryDisplay = screen.getPrimaryDisplay();
    
    mainWindow = new BrowserWindow({
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        hasShadow: false,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        focusable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Start with click-through enabled so clicks pass to apps below
    mainWindow.setIgnoreMouseEvents(true);
    
    // Start as non-focusable so keys pass through initially
    mainWindow.setFocusable(false);
    
    // Position window on the initial display (will follow mouse cursor after app is ready)
    const { x, y, width, height } = primaryDisplay.bounds;
    mainWindow.setPosition(x, y);
    mainWindow.setSize(width, height);
    
    // Set window level to be above all other windows, including fullscreen apps
    // Use 'floating' level which stays above fullscreen without triggering dock
    mainWindow.setAlwaysOnTop(true, 'floating');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    
    // On macOS, set additional window properties to prevent dock from showing
    if (process.platform === 'darwin') {
        // Set window collection behavior to prevent dock activation
        mainWindow.setWindowButtonVisibility(false);
    }
    
    mainWindow.loadFile('renderer.html');
    
    // Prevent the window from being closed unless actually quitting
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    // Handle display changes (monitor resolution, fullscreen, taskbar changes, etc.)
    screen.on('display-metrics-changed', () => {
        updateWindowBounds();
    });
    
    // Also update when display is added/removed
    screen.on('display-added', updateWindowBounds);
    screen.on('display-removed', updateWindowBounds);
}

function createCatchWindow() {
    const currentDisplay = getTargetDisplay();
    const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = currentDisplay.bounds;
    
    // Create a 100x100 window in bottom-right corner to catch clicks
    const windowOptions = {
        width: 100,
        height: 100,
        x: displayX + displayWidth - 100,
        y: displayY + displayHeight - 100,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        hasShadow: false,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        focusable: false,
        acceptFirstMouse: true,
        backgroundColor: '#00000000',
        opacity: 0.99,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            offscreen: false,
            backgroundThrottling: false
        }
    };
    
    // On macOS Sequoia, avoid vibrancy (causes white background)
    // Instead rely on pure transparency with opacity trick
    
    catchWindow = new BrowserWindow(windowOptions);
    
    catchWindow.setAlwaysOnTop(true, 'screen-saver', 1); // One level below main window
    catchWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    
    if (process.platform === 'darwin') {
        catchWindow.setWindowButtonVisibility(false);
        // Force transparency at multiple points - Sequoia needs repeated assertions
        catchWindow.setBackgroundColor('#00000000');
        catchWindow.setOpacity(0.99); // Just under 1.0 forces transparency path
        
        // Multiple repaint cycles to force compositor update on external monitors
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                catchWindow.setBackgroundColor('#00000000');
                catchWindow.setOpacity(0.99);
                const bounds = catchWindow.getBounds();
                catchWindow.setBounds({ ...bounds, height: bounds.height + 1 });
                catchWindow.setBounds(bounds);
            }, 50 * (i + 1));
        }
    }
    
    // Load a simple HTML that just calls toggleDrawing when clicked
    catchWindow.loadFile('catch-window.html');
    
    // After content loads, reposition and force transparency refresh
    catchWindow.webContents.on('did-finish-load', () => {
        const currentDisplay = getTargetDisplay();
        const { x, y, width, height } = currentDisplay.bounds;
        // Reposition after load to match the positioning logic used after open/close
        catchWindow.setPosition(x + width - 100, y + height - 100);
        
        // On macOS Sequoia, aggressively force transparency after content loads
        if (process.platform === 'darwin') {
            // Multiple cycles to combat Sequoia's compositor behavior
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    catchWindow.setBackgroundColor('#00000000');
                    catchWindow.setOpacity(0.99);
                    if (i % 2 === 0) {
                        const bounds = catchWindow.getBounds();
                        catchWindow.setBounds({ ...bounds, width: bounds.width + (i % 2 ? 1 : -1) });
                        setTimeout(() => catchWindow.setBounds(bounds), 10);
                    }
                }, 30 * (i + 1));
            }
        }
        
        catchWindow.webContents.send('display-bounds', currentDisplay.bounds);
    });
    
    catchWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            catchWindow.hide();
        }
    });
}

function updateWindowBounds() {
    if (mainWindow) {
        // Get the target display (locked or auto-follow cursor)
        const currentDisplay = getTargetDisplay();
        
        updateWindowToDisplay(currentDisplay);
    }
}

function updateWindowToDisplay(display) {
    if (mainWindow) {
        const { x, y, width, height } = display.bounds;
        const currentBounds = mainWindow.getBounds();
        
        // Check if we're actually moving to a different display
        const isMovingDisplay = (currentBounds.x !== x || currentBounds.y !== y || 
                                 currentBounds.width !== width || currentBounds.height !== height);
        
        mainWindow.setBounds({ x, y, width, height });
        
        // Also move catch window
        if (catchWindow && !isDrawingEnabled) {
            // On macOS Sequoia with external monitors, only recreate window when actually moving displays
            if (process.platform === 'darwin' && isMovingDisplay) {
                const wasVisible = catchWindow.isVisible();
                catchWindow.destroy();
                createCatchWindow();
                if (wasVisible) {
                    catchWindow.show();
                }
            } else if (!isMovingDisplay) {
                // Just ensure it's positioned correctly on the same display
                catchWindow.setPosition(x + width - 100, y + height - 100);
            } else {
                // Windows: just reposition
                catchWindow.setPosition(x + width - 100, y + height - 100);
            }
        }
        
        // Notify renderer to reposition UI elements
        mainWindow.webContents.send('display-changed');
    }
}

// Track mouse movement to follow active display
let mouseTrackingInterval = null;

function startMouseTracking() {
    // Check cursor position every 1 second to see if it moved to a different display
    mouseTrackingInterval = setInterval(() => {
        if (!mainWindow) return;
        
        // Skip if display is locked
        if (lockedDisplayId !== null) {
            return;
        }
        
        const cursorPoint = screen.getCursorScreenPoint();
        const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
        const windowBounds = mainWindow.getBounds();
        
        // Check if window is on the same display as cursor
        const windowDisplay = screen.getDisplayMatching(windowBounds);
        
        // If cursor moved to a different display, move window there
        if (windowDisplay.id !== currentDisplay.id) {
            console.log(`Moving overlay to display ${currentDisplay.id}`);
            updateWindowToDisplay(currentDisplay);
        }
    }, 1000); // Check every second
}

function stopMouseTracking() {
    if (mouseTrackingInterval) {
        clearInterval(mouseTrackingInterval);
        mouseTrackingInterval = null;
    }
}

function createTray() {
    // Create tray icon
    const iconPath = path.join(__dirname, 'icons', 'icon16.png');
    
    if (!fs.existsSync(iconPath)) {
        console.error('Tray icon not found at:', iconPath);
        return;
    }
    
    try {
        tray = new Tray(iconPath);
        
        updateTrayMenu();
        
        const version = app.getVersion();
        tray.setToolTip(`Peter Marker v${version} - Click to toggle`);
        
        // Click on tray icon toggles drawing mode
        tray.on('click', () => {
            toggleDrawing();
        });
    } catch (err) {
        console.error('Failed to create tray:', err);
    }
}

function getAutoStartEnabled() {
    const loginSettings = app.getLoginItemSettings();
    return loginSettings.openAtLogin;
}

function setAutoStartEnabled(enabled) {
    app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: false,
        args: []
    });
}

function toggleAutoStart() {
    const currentState = getAutoStartEnabled();
    setAutoStartEnabled(!currentState);
    updateTrayMenu();
}

function updateTrayMenu() {
    if (!tray) {
        console.warn('Tray not initialized, skipping menu update');
        return;
    }
    
    const autoStartEnabled = getAutoStartEnabled();
    const version = app.getVersion();
    
    // Build display lock submenu
    const displays = screen.getAllDisplays();
    const displayMenuItems = [
        {
            label: lockedDisplayId === null ? '● Auto (Follow Cursor)' : '○ Auto (Follow Cursor)',
            click: () => setDisplayLock(null)
        },
        { type: 'separator' }
    ];
    
    // Add menu item for each display
    displays.forEach((display, index) => {
        const isPrimary = display.id === screen.getPrimaryDisplay().id;
        const isLocked = display.id === lockedDisplayId;
        const label = `${isLocked ? '●' : '○'} Display ${index + 1}${isPrimary ? ' (Primary)' : ''} - ${display.bounds.width}x${display.bounds.height}`;
        
        displayMenuItems.push({
            label: label,
            click: () => setDisplayLock(display.id)
        });
    });
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: `Peter Marker v${version}`,
            enabled: false
        },
        { type: 'separator' },
        {
            label: isDrawingEnabled ? 'Disable Drawing' : 'Enable Drawing',
            click: () => toggleDrawing()
        },
        {
            label: 'Clear Canvas',
            click: () => {
                if (mainWindow) {
                    mainWindow.webContents.send('clear-canvas');
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Lock to Display',
            submenu: displayMenuItems
        },
        { type: 'separator' },
        {
            label: 'Check for Updates',
            click: () => checkForUpdates()
        },
        { type: 'separator' },
        {
            label: autoStartEnabled ? '☑ Start on Boot' : '☐ Start on Boot',
            click: () => toggleAutoStart()
        },
        { type: 'separator' },
        {
            label: 'Open Debugger',
            click: () => {
                if (mainWindow) {
                    mainWindow.webContents.openDevTools();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit Peter Marker',
            click: () => {
                app.isQuitting = true;
                if (mainWindow) {
                    mainWindow.destroy();
                }
                app.quit();
            }
        }
    ]);
    
    tray.setContextMenu(contextMenu);
}

function toggleDrawing() {
    isDrawingEnabled = !isDrawingEnabled;
    
    if (mainWindow) {
        if (isDrawingEnabled) {
            // Hide catch window when drawing
            if (catchWindow) {
                catchWindow.hide();
            }
            
            // When drawing is enabled, capture all mouse events
            mainWindow.setIgnoreMouseEvents(false);
            
            // On macOS, enter kiosk mode to prevent dock from showing
            if (process.platform === 'darwin') {
                mainWindow.setKiosk(true);
                // Register global shortcuts for closing
                registerDrawingShortcuts();
            } else {
                mainWindow.setFocusable(true);
                mainWindow.focus();
            }
            
            mainWindow.show();
        } else {
            // Show catch window when not drawing
            if (catchWindow) {
                // Ensure catch window is on the correct display before showing
                const targetDisplay = getTargetDisplay();
                const { x, y, width, height } = targetDisplay.bounds;
                catchWindow.setPosition(x + width - 100, y + height - 100);
                
                // On Windows, ensure window is clickable after showing
                if (process.platform === 'win32') {
                    catchWindow.setAlwaysOnTop(true, 'screen-saver', 1);
                }
                
                catchWindow.show();
            }
            
            // When drawing is disabled, pass through clicks
            mainWindow.setIgnoreMouseEvents(true);
            
            // On macOS, exit kiosk mode and unregister shortcuts
            if (process.platform === 'darwin') {
                unregisterDrawingShortcuts();
                // Set non-focusable BEFORE exiting kiosk to prevent focus steal
                mainWindow.setFocusable(false);
                mainWindow.setKiosk(false);
                
                // Activate the previous application (PowerPoint) and hide dock quickly
                const { exec } = require('child_process');
                exec('osascript -e \'tell application "System Events" to set frontmost of first process whose frontmost is true to true\' -e \'tell application "System Events" to set autohide of dock preferences to true\'');
                // Restore dock autohide to user preference after brief delay
                exec('osascript -e \'tell application "System Events" to set autohide of dock preferences to false\'');
                setTimeout(() => {
                    exec('osascript -e \'tell application "System Events" to set autohide of dock preferences to false\'');
                }, 100);
            } else {
                mainWindow.setFocusable(false);
                mainWindow.blur();
            }
        }
        
        // Send message to renderer
        mainWindow.webContents.send('toggle-drawing', isDrawingEnabled);
    }
    
    updateTrayMenu();
}

// IPC handlers
ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
    if (mainWindow) {
        if (ignore) {
            mainWindow.setIgnoreMouseEvents(true);
        } else {
            mainWindow.setIgnoreMouseEvents(false);
        }
    }
});

ipcMain.on('close-drawing', () => {
    if (isDrawingEnabled) {
        isDrawingEnabled = false;
        
        // Show catch window when closing
        if (catchWindow) {
            // Ensure catch window is on the correct display before showing
            const targetDisplay = getTargetDisplay();
            const { x, y, width, height } = targetDisplay.bounds;
            catchWindow.setPosition(x + width - 100, y + height - 100);
            
            // On Windows, ensure window is clickable after showing
            if (process.platform === 'win32') {
                catchWindow.setAlwaysOnTop(true, 'screen-saver', 1);
            }
            
            catchWindow.show();
        }
        
        if (mainWindow) {
            mainWindow.setIgnoreMouseEvents(true);
            
            if (process.platform === 'darwin') {
                unregisterDrawingShortcuts();
                mainWindow.setFocusable(false);
                mainWindow.setKiosk(false);
                
                // Activate the previous application (PowerPoint) and hide dock quickly
                const { exec } = require('child_process');
                exec('osascript -e \'tell application "System Events" to set frontmost of first process whose frontmost is true to true\' -e \'tell application "System Events" to set autohide of dock preferences to true\'');
                // Restore dock autohide to user preference after brief delay
                setTimeout(() => {
                    exec('osascript -e \'tell application "System Events" to set autohide of dock preferences to false\'');
                }, 100);
            } else {
                mainWindow.setFocusable(false);
                mainWindow.blur();
            }
            
            mainWindow.webContents.send('toggle-drawing', false);
        }
        updateTrayMenu();
    }
});

ipcMain.on('toggle-drawing', () => {
    toggleDrawing();
});

ipcMain.on('open-drawing', () => {
    if (!isDrawingEnabled) {
        isDrawingEnabled = true;
        if (mainWindow) {
            mainWindow.setIgnoreMouseEvents(false);
            
            if (process.platform === 'darwin') {
                mainWindow.setKiosk(true);
                registerDrawingShortcuts();
            } else {
                mainWindow.setFocusable(true);
                mainWindow.focus();
            }
            
            mainWindow.webContents.send('toggle-drawing', true);
        }
        updateTrayMenu();
    }
});

ipcMain.on('forward-key', (event, keyCode) => {
    // Close drawing mode first
    if (isDrawingEnabled) {
        toggleDrawing(); // This will close pen and make window non-focusable
    }
});

// Global shortcuts for drawing mode on macOS (when in kiosk mode)
function registerDrawingShortcuts() {
    if (process.platform !== 'darwin') return;
    
    // Register shortcuts to close the pen
    const closeKeys = ['Escape', 'Left', 'Right', 'Up', 'Down', 'PageUp', 'PageDown', 'Space', 'Enter'];
    
    closeKeys.forEach(key => {
        try {
            globalShortcut.register(key, () => {
                if (isDrawingEnabled) {
                    toggleDrawing();
                }
            });
        } catch (err) {
            console.warn(`Could not register shortcut: ${key}`, err);
        }
    });
}

function unregisterDrawingShortcuts() {
    if (process.platform !== 'darwin') return;
    
    const closeKeys = ['Escape', 'Left', 'Right', 'Up', 'Down', 'PageUp', 'PageDown', 'Space', 'Enter'];
    
    closeKeys.forEach(key => {
        try {
            globalShortcut.unregister(key);
        } catch (err) {
            console.warn(`Could not unregister shortcut: ${key}`, err);
        }
    });
}

// Track if this is a manual update check (vs automatic)
let isManualUpdateCheck = false;
let progressWindow = null;

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    
    if (mainWindow) {
        const { dialog } = require('electron');
        
        if (process.platform === 'darwin') {
            // macOS: Direct user to GitHub releases for manual download (unsigned app)
            const response = dialog.showMessageBoxSync(mainWindow, {
                type: 'info',
                title: 'Update Available',
                message: `Peter Marker v${info.version} is available!`,
                detail: 'Click "Download Update" to visit the releases page and download the latest version manually.',
                buttons: ['Download Update', 'Later'],
                defaultId: 0,
                cancelId: 1
            });
            
            if (response === 0) {
                // Open GitHub releases page
                shell.openExternal('https://github.com/rol4400/Peter-Marker/releases/latest');
            }
        } else {
            // Windows: Automatic update with download
            const response = dialog.showMessageBoxSync(mainWindow, {
                type: 'info',
                title: 'Update Available',
                message: `An update to Peter Marker is available (v${info.version}). Would you like to install it now?`,
                detail: 'The marker program will restart after the update is installed.',
                buttons: ['Yes', 'No'],
                defaultId: 0,
                cancelId: 1
            });
            
            if (response === 0) {
                // User clicked Yes - start download and show progress
                createProgressWindow();
                autoUpdater.downloadUpdate();
            }
        }
    }
    isManualUpdateCheck = false;
});

autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
    // Only show dialog if this was a manual check
    if (isManualUpdateCheck && mainWindow) {
        require('electron').dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            title: 'No Updates',
            message: 'You are running the latest version of Peter Marker.',
            buttons: ['OK']
        });
    }
    isManualUpdateCheck = false;
});

autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
    
    // Close progress window if open
    if (progressWindow) {
        progressWindow.close();
        progressWindow = null;
    }
    
    // Only show error dialog if this was a manual check
    if (isManualUpdateCheck && mainWindow) {
        let message = 'Failed to check for updates.';
        
        // Provide more helpful messages based on the error
        if (err.message && err.message.includes('net::ERR_INTERNET_DISCONNECTED')) {
            message = 'No internet connection. Please check your network and try again.';
        } else if (err.message && err.message.includes('404')) {
            message = 'No updates are available yet. This is the first release.';
        } else if (err.message && (err.message.includes('github') || err.message.includes('release'))) {
            message = 'Unable to connect to update server. You may be running the latest version.';
        }
        
        require('electron').dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            title: 'Update Check',
            message: message,
            buttons: ['OK']
        });
    }
    isManualUpdateCheck = false;
});

autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    const speed = progressObj.bytesPerSecond;
    console.log(`Download progress: ${percent}% at ${(speed / 1024 / 1024).toFixed(2)} MB/s`);
    
    // Update progress window
    if (progressWindow && progressWindow.webContents) {
        progressWindow.webContents.send('download-progress', percent, speed);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded, ready to install:', info.version);
    
    // Close progress window
    if (progressWindow) {
        progressWindow.close();
        progressWindow = null;
    }
    
    const { dialog } = require('electron');
    
    // Windows only: macOS doesn't download, it links to GitHub
    const result = dialog.showMessageBoxSync({
        type: 'info',
        title: 'Update Ready',
        message: `Peter Marker v${info.version} has been downloaded and is ready to install.`,
        detail: 'Would you like to quit and install the update now?',
        buttons: ['Quit and Install', 'Later'],
        defaultId: 0,
        cancelId: 1
    });
    
    if (result === 0) {
        app.isQuitting = true;
        setImmediate(() => {
            app.removeAllListeners('window-all-closed');
            autoUpdater.quitAndInstall(false, true);
        });
    }
});

function createProgressWindow() {
    if (progressWindow) return;
    
    progressWindow = new BrowserWindow({
        width: 450,
        height: 200,
        resizable: false,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'update-preload.js')
        }
    });
    
    progressWindow.loadFile('update-progress.html');
    
    progressWindow.on('closed', () => {
        progressWindow = null;
    });
}

function checkForUpdates() {
    isManualUpdateCheck = true;
    autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
    // Load display settings from disk
    loadDisplaySettings();
    
    // Enable auto-start by default on first launch
    const loginSettings = app.getLoginItemSettings();
    if (!loginSettings.wasOpenedAtLogin && !loginSettings.wasOpenedAsHidden) {
        // First time running - enable auto-start by default
        setAutoStartEnabled(true);
    }
    
    createWindow();
    createCatchWindow();
    createTray();
    
    // Start tracking mouse to follow active display
    startMouseTracking();
    
    // Check for updates on startup after a short delay
    setTimeout(() => {
        console.log('Checking for updates on startup...');
        autoUpdater.checkForUpdates();
    }, 3000);
    
    // Register global shortcut only for toggle (Cmd/Ctrl + Shift + D)
    globalShortcut.register('CommandOrControl+Shift+D', () => {
        toggleDrawing();
    });
    
    // Don't register arrow keys, Escape, PageUp/Down globally
    // Let them be handled by the renderer so they can be forwarded to the focused app
});

app.on('before-quit', () => {
    app.isQuitting = true;
});

app.on('window-all-closed', () => {
    // On macOS, keep the app running in the background
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('will-quit', () => {
    // Stop mouse tracking
    stopMouseTracking();
    
    // Unregister all shortcuts
    globalShortcut.unregisterAll();
});
