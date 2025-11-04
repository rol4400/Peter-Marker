const { app, BrowserWindow, Tray, Menu, screen, ipcMain, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;
let tray;
let isDrawingEnabled = false;

// Configure auto-updater
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false; // Don't auto-download, let user decide
autoUpdater.autoInstallOnAppQuit = true;

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
    
    // Set window level to be above all other windows
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    
    mainWindow.loadFile('renderer.html');
    
    // Prevent the window from being closed
    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow.hide();
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
    const iconPath = path.join(__dirname, 'icons', process.platform === 'darwin' ? 'tray-icon-mac.png' : 'icon16.png');
    tray = new Tray(iconPath);
    
    updateTrayMenu();
    
    tray.setToolTip('Peter Marker - Click to toggle');
    
    // Click on tray icon toggles drawing mode
    tray.on('click', () => {
        toggleDrawing();
    });
}

function updateTrayMenu() {
    const contextMenu = Menu.buildFromTemplate([
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
            label: 'Quit Peter Marker',
            click: () => {
                app.isQuitting = true;
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
            // When drawing is enabled, capture all mouse events
            mainWindow.setIgnoreMouseEvents(false);
            mainWindow.focus();
            mainWindow.setFocusable(true);
        } else {
            // When drawing is disabled, pass through clicks (but can be overridden for UI elements)
            mainWindow.setIgnoreMouseEvents(true, { forward: true });
            mainWindow.blur();
            mainWindow.setFocusable(false);
        }
        
        mainWindow.show();
        
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
            mainWindow.blur();
            mainWindow.setFocusable(false);
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

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    if (mainWindow) {
        const response = require('electron').dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `A new version (${info.version}) is available. Would you like to download it now?`,
            buttons: ['Download', 'Later'],
            defaultId: 0
        });
        
        if (response === 0) {
            autoUpdater.downloadUpdate();
        }
    }
});

autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
    if (mainWindow) {
        require('electron').dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            title: 'No Updates',
            message: 'You are running the latest version of Peter Marker.',
            buttons: ['OK']
        });
    }
});

autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
    let message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`;
    console.log(message);
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    if (mainWindow) {
        const response = require('electron').dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            title: 'Update Ready',
            message: `Version ${info.version} has been downloaded. Restart the application to install the update.`,
            buttons: ['Restart Now', 'Later'],
            defaultId: 0
        });
        
        if (response === 0) {
            autoUpdater.quitAndInstall();
        }
    }
});

function checkForUpdates() {
    autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
    createWindow();
    createTray();
    
    // Start tracking mouse to follow active display
    startMouseTracking();
    
    // Check for updates on startup (after a delay to not slow down launch)
    setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
    
    // Register global shortcut only for toggle (Cmd/Ctrl + Shift + D)
    globalShortcut.register('CommandOrControl+Shift+D', () => {
        toggleDrawing();
    });
    
    // Don't register arrow keys, Escape, PageUp/Down globally
    // Let them be handled by the renderer so they can be forwarded to the focused app
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
