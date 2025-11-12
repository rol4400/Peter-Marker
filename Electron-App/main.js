const { app, BrowserWindow, Tray, Menu, screen, ipcMain, globalShortcut, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// Settings file path
const settingsPath = path.join(app.getPath('userData'), 'display-settings.json');

// Load settings from disk
function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(data);
            displayConfigurations = settings.displayConfigurations || {};
            
            // Try to restore locked display for current configuration
            const currentConfig = getCurrentDisplayConfiguration();
            if (displayConfigurations[currentConfig]) {
                const savedDisplayId = displayConfigurations[currentConfig];
                // Check if the display still exists
                const displays = screen.getAllDisplays();
                if (displays.find(d => d.id === savedDisplayId)) {
                    lockedDisplayId = savedDisplayId;
                    console.log(`Restored locked display: ${savedDisplayId}`);
                }
            }
        }
    } catch (err) {
        console.error('Failed to load settings:', err);
    }
}

// Save settings to disk
function saveSettings() {
    try {
        const currentConfig = getCurrentDisplayConfiguration();
        if (lockedDisplayId !== null) {
            displayConfigurations[currentConfig] = lockedDisplayId;
        } else {
            delete displayConfigurations[currentConfig];
        }
        
        const settings = {
            lockedDisplayId,
            displayConfigurations
        };
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (err) {
        console.error('Failed to save settings:', err);
    }
}

// Get a unique identifier for current display configuration
function getCurrentDisplayConfiguration() {
    const displays = screen.getAllDisplays();
    // Sort by ID to ensure consistent ordering
    const sortedDisplays = displays.sort((a, b) => a.id - b.id);
    // Create a signature based on display count and IDs
    return sortedDisplays.map(d => d.id).join('-');
}

// Get the target display based on lock state
function getTargetDisplay() {
    if (lockedDisplayId !== null) {
        // Try to find the locked display
        const displays = screen.getAllDisplays();
        const lockedDisplay = displays.find(d => d.id === lockedDisplayId);
        if (lockedDisplay) {
            return lockedDisplay;
        }
        // If locked display not found, fall back to cursor position
        console.log('Locked display not found, falling back to cursor position');
    }
    // Auto mode: follow cursor
    const cursorPoint = screen.getCursorScreenPoint();
    return screen.getDisplayNearestPoint(cursorPoint);
}

let mainWindow;
let catchWindow; // Invisible window to catch clicks on pen icon area
let tray;
let isDrawingEnabled = false;

// Display locking state
let lockedDisplayId = null; // null = auto mode (follow cursor)
let displayConfigurations = {}; // Store display configs by unique identifier

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
}

function createCatchWindow() {
    // Use locked display if set, otherwise follow cursor
    let targetDisplay;
    if (lockedDisplayId !== null) {
        const displays = screen.getAllDisplays();
        targetDisplay = displays.find(d => d.id === lockedDisplayId);
        if (!targetDisplay) {
            // Locked display not found, fall back to cursor
            const cursorPoint = screen.getCursorScreenPoint();
            targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
        }
    } else {
        // Auto mode: follow cursor
        const cursorPoint = screen.getCursorScreenPoint();
        targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
    }
    const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = targetDisplay.bounds;
    
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
        // Use the same display logic as createCatchWindow
        let targetDisplay;
        if (lockedDisplayId !== null) {
            const displays = screen.getAllDisplays();
            targetDisplay = displays.find(d => d.id === lockedDisplayId);
            if (!targetDisplay) {
                const cursorPoint = screen.getCursorScreenPoint();
                targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
            }
        } else {
            const cursorPoint = screen.getCursorScreenPoint();
            targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
        }
        const { x, y, width, height } = targetDisplay.bounds;
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
        
        catchWindow.webContents.send('display-bounds', targetDisplay.bounds);
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
        // Only update if we're locked to a display
        // In auto mode, let the mouse tracking handle it
        if (lockedDisplayId !== null) {
            const displays = screen.getAllDisplays();
            const targetDisplay = displays.find(d => d.id === lockedDisplayId);
            if (targetDisplay) {
                updateWindowToDisplay(targetDisplay);
            }
        } else {
            // Auto mode: get display at cursor position
            const cursorPoint = screen.getCursorScreenPoint();
            const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
            updateWindowToDisplay(currentDisplay);
        }
    }
}

function updateWindowToDisplay(display) {
    if (mainWindow) {
        const { x, y, width, height } = display.bounds;
        mainWindow.setBounds({ x, y, width, height });
        
        // Also move catch window
        if (catchWindow && !isDrawingEnabled) {
            // On macOS Sequoia with external monitors, recreate window for clean transparency
            if (process.platform === 'darwin') {
                const wasVisible = catchWindow.isVisible();
                catchWindow.destroy();
                createCatchWindow();
                // Ensure catch window is on the same display as main window
                catchWindow.setPosition(x + width - 100, y + height - 100);
                if (wasVisible) {
                    catchWindow.show();
                }
            } else {
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
        
        // If locked to a display, don't follow cursor
        if (lockedDisplayId !== null) {
            // But check if the locked display still exists
            const displays = screen.getAllDisplays();
            const lockedDisplay = displays.find(d => d.id === lockedDisplayId);
            if (!lockedDisplay) {
                // Locked display disconnected, switch to auto mode
                console.log('Locked display disconnected, switching to auto mode');
                lockedDisplayId = null;
                saveSettings();
                updateTrayMenu();
                updateWindowBounds();
            }
            return;
        }
        
        // Auto mode: follow cursor
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
    
    // Build display submenu
    const displays = screen.getAllDisplays();
    const displayMenuItems = [
        {
            label: lockedDisplayId === null ? '● Auto (Follow Cursor)' : '○ Auto (Follow Cursor)',
            click: () => {
                lockedDisplayId = null;
                saveSettings();
                updateTrayMenu();
                // Update window position immediately
                updateWindowBounds();
            }
        },
        { type: 'separator' }
    ];
    
    // Add each display
    displays.forEach((display, index) => {
        const isLocked = lockedDisplayId === display.id;
        const isPrimary = display.bounds.x === 0 && display.bounds.y === 0;
        let label = `${isLocked ? '● ' : '○ '}Display ${index + 1}`;
        if (isPrimary) {
            label += ' (Primary)';
        }
        label += ` - ${display.bounds.width}x${display.bounds.height}`;
        
        displayMenuItems.push({
            label,
            click: () => {
                lockedDisplayId = display.id;
                saveSettings();
                updateTrayMenu();
                // Move to locked display immediately
                updateWindowToDisplay(display);
            }
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
            // Ensure main window is on the same display as catch window
            if (catchWindow) {
                const catchBounds = catchWindow.getBounds();
                const catchDisplay = screen.getDisplayMatching(catchBounds);
                const mainBounds = mainWindow.getBounds();
                const mainDisplay = screen.getDisplayMatching(mainBounds);
                
                // If they're on different displays, move main window to catch window's display
                if (catchDisplay.id !== mainDisplay.id) {
                    const { x, y, width, height } = catchDisplay.bounds;
                    mainWindow.setBounds({ x, y, width, height });
                }
            }
            
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
    
    // Always prompt user when update is available (startup or manual)
    if (mainWindow) {
        const { dialog } = require('electron');
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
    
    if (process.platform === 'darwin') {
        // macOS: For unsigned apps, open the DMG manually so user can install
        const updatePath = path.join(app.getPath('userData'), 'pending-update');
        
        // Try to find the downloaded DMG
        if (fs.existsSync(updatePath)) {
            const files = fs.readdirSync(updatePath);
            const dmgFile = files.find(f => f.endsWith('.dmg'));
            
            if (dmgFile) {
                const dmgPath = path.join(updatePath, dmgFile);
                
                const result = dialog.showMessageBoxSync({
                    type: 'info',
                    title: 'Update Downloaded',
                    message: `Peter Marker v${info.version} has been downloaded.`,
                    detail: 'Click "Open Installer" to install the update manually. You may need to right-click the app and select "Open" to bypass Gatekeeper.',
                    buttons: ['Open Installer', 'Later'],
                    defaultId: 0,
                    cancelId: 1
                });
                
                if (result === 0) {
                    // Open the DMG file
                    shell.openPath(dmgPath);
                }
                return;
            }
        }
        
        // Fallback: If we can't find the DMG, use standard quit and install
        const result = dialog.showMessageBoxSync({
            type: 'info',
            title: 'Update Ready',
            message: `Peter Marker v${info.version} has been downloaded.`,
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
    } else {
        // Windows: Install and restart immediately
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
    // Load saved settings first
    loadSettings();
    
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
    
    // Listen for display configuration changes
    screen.on('display-added', (newDisplay) => {
        console.log('Display added:', newDisplay.id);
        updateTrayMenu(); // Refresh menu to show new display
        
        // Check if this is our previously locked display returning
        const currentConfig = getCurrentDisplayConfiguration();
        if (displayConfigurations[currentConfig]) {
            const savedDisplayId = displayConfigurations[currentConfig];
            if (savedDisplayId === newDisplay.id) {
                lockedDisplayId = savedDisplayId;
                updateWindowToDisplay(newDisplay);
                updateTrayMenu();
            }
        }
    });
    
    screen.on('display-removed', (oldDisplay) => {
        console.log('Display removed:', oldDisplay.id);
        updateTrayMenu(); // Refresh menu to remove display
        
        // If the removed display was locked, switch to auto mode
        if (lockedDisplayId === oldDisplay.id) {
            console.log('Locked display removed, switching to auto mode');
            lockedDisplayId = null;
            saveSettings();
            updateTrayMenu();
            updateWindowBounds();
        }
    });
    
    screen.on('display-metrics-changed', (display, changedMetrics) => {
        console.log('Display metrics changed:', display.id, changedMetrics);
        updateTrayMenu(); // Refresh menu with updated resolution
        
        // If locked to this display, update window bounds
        if (lockedDisplayId === display.id) {
            updateWindowToDisplay(display);
        } else if (lockedDisplayId === null) {
            // In auto mode, update if this is the current display
            const windowBounds = mainWindow.getBounds();
            const windowDisplay = screen.getDisplayMatching(windowBounds);
            if (windowDisplay.id === display.id) {
                updateWindowToDisplay(display);
            }
        }
    });
    
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
