const { app, BrowserWindow, Tray, Menu, screen, ipcMain, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;
let isDrawingEnabled = false;

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
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    
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

function updateWindowBounds() {
    if (mainWindow) {
        // Get the display where the cursor currently is
        const cursorPoint = screen.getCursorScreenPoint();
        const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
        
        updateWindowToDisplay(currentDisplay);
    }
}

function updateWindowToDisplay(display) {
    if (mainWindow) {
        const { x, y, width, height } = display.bounds;
        mainWindow.setBounds({ x, y, width, height });
        
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
            // When drawing is enabled, capture all mouse events and keyboard
            mainWindow.setIgnoreMouseEvents(false);
            mainWindow.setFocusable(true);
            mainWindow.focus();
            mainWindow.show();
        } else {
            // When drawing is disabled, pass through clicks (but can be overridden for UI elements)
            mainWindow.setIgnoreMouseEvents(true, { forward: true });
            mainWindow.setFocusable(false);
            
            // On macOS, hide the window briefly to force focus back to the previous app
            if (process.platform === 'darwin') {
                mainWindow.hide();
                setTimeout(() => {
                    if (mainWindow) {
                        mainWindow.show();
                    }
                }, 50);
            } else {
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
    // Allow renderer to control click-through for specific areas (like pen icon)
    if (mainWindow) {
        if (ignore) {
            mainWindow.setIgnoreMouseEvents(true, { forward: true });
        } else {
            mainWindow.setIgnoreMouseEvents(false);
        }
    }
});

ipcMain.on('close-drawing', () => {
    if (isDrawingEnabled) {
        isDrawingEnabled = false;
        if (mainWindow) {
            mainWindow.setIgnoreMouseEvents(true, { forward: true });
            mainWindow.setFocusable(false);
            
            // On macOS, hide the window briefly to force focus back to the previous app
            if (process.platform === 'darwin') {
                mainWindow.hide();
                setTimeout(() => {
                    if (mainWindow) {
                        mainWindow.show();
                    }
                }, 50);
            } else {
                mainWindow.blur();
            }
            
            mainWindow.webContents.send('toggle-drawing', false);
        }
        updateTrayMenu();
    }
});

ipcMain.on('open-drawing', () => {
    if (!isDrawingEnabled) {
        isDrawingEnabled = true;
        if (mainWindow) {
            mainWindow.setIgnoreMouseEvents(false);
            mainWindow.setFocusable(true);
            mainWindow.focus();
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
    
    // On macOS with unsigned apps, we need to quit and the update will install on next launch
    // On Windows, we can install immediately
    if (process.platform === 'darwin') {
        // macOS: Update will install on next launch
        const { dialog } = require('electron');
        const result = dialog.showMessageBoxSync({
            type: 'info',
            title: 'Update Ready',
            message: `Peter Marker v${info.version} has been downloaded and is ready to install.`,
            detail: 'The update will be installed the next time you launch the app. Would you like to quit now?',
            buttons: ['Quit and Update', 'Later'],
            defaultId: 0,
            cancelId: 1
        });
        
        if (result === 0) {
            // User chose to quit now
            app.isQuitting = true;
            app.quit();
        }
    } else {
        // Windows: Install and restart immediately
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
    // Enable auto-start by default on first launch
    const loginSettings = app.getLoginItemSettings();
    if (!loginSettings.wasOpenedAtLogin && !loginSettings.wasOpenedAsHidden) {
        // First time running - enable auto-start by default
        setAutoStartEnabled(true);
    }
    
    createWindow();
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

// Set the app to start at login (Mac)
if (process.platform === 'darwin') {
    app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: true
    });
}
