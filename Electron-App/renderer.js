// Drawing variables
let isDrawing = false;
let isEnabled = false;
let isErasing = false;
let penColor = "#ff0000";
let drawingHistory = [];
let currentHistoryIndex = -1;

// Get DOM elements
const penIcon = document.getElementById('penIcon');
const toolbarContainer = document.getElementById('toolbarContainer');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const eraserCursor = document.getElementById('eraserCursor');

// Set initial canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Position pen icon and toolbar at actual bottom of viewport
function positionPenIcon() {
    const viewportHeight = window.innerHeight;
    // On macOS, add extra offset to account for dock area (even when hidden)
    const isMac = navigator.platform.toLowerCase().includes('mac');
    
    // When in kiosk mode (drawing enabled), window is fullscreen so use smaller offset
    // When not in kiosk, window includes dock area so use larger offset to compensate
    const bottomOffset = isMac ? (isEnabled ? 20 : 40) : 20;
    
    // Position pen icon
    penIcon.style.bottom = `${bottomOffset}px`;
    
    // Position toolbar (to the left of pen icon)
    toolbarContainer.style.bottom = `${bottomOffset}px`;
    
    // Update color picker position if toolbar is visible
    updateColorPickerPosition();
    if (isEnabled) {
        setTimeout(updateColorPickerPosition, 50);
    }
}

resizeCanvas();
positionPenIcon();

window.addEventListener('resize', () => {
    resizeCanvas();
    positionPenIcon();
});

// Handle fullscreen changes (both F11 fullscreen and presentation mode)
document.addEventListener('fullscreenchange', positionPenIcon);
document.addEventListener('webkitfullscreenchange', positionPenIcon); // Safari
document.addEventListener('mozfullscreenchange', positionPenIcon); // Firefox

// Also listen for window focus changes which can indicate fullscreen
window.addEventListener('focus', positionPenIcon);
window.addEventListener('blur', positionPenIcon);

// Color picker functionality
colorPicker.addEventListener('input', () => {
    penColor = colorPicker.value;
    document.getElementById('color').style.background = penColor;
});

// Update color picker position
function updateColorPickerPosition() {
    const colorBtn = document.getElementById('color');
    const colorBtnRect = colorBtn.getBoundingClientRect();
    colorPicker.style.left = `${colorBtnRect.left}px`;
    colorPicker.style.top = `${colorBtnRect.top}px`;
}

function closeColorPicker() {
    colorPicker.style.opacity = '0';
    colorPicker.type = 'text';
    setTimeout(() => {
        colorPicker.type = 'color';
    }, 50);
}

// Handle clicks outside color picker
function handleOutsideClick(e) {
    const isColorPickerVisible = colorPicker.style.opacity === '1';
    if (!isColorPickerVisible) return;
    
    const colorBtn = document.getElementById('color');
    const isColorButton = colorBtn.contains(e.target) || e.target === colorBtn;
    const isColorPicker = colorPicker.contains(e.target) || e.target === colorPicker;
    
    if (!isColorButton && !isColorPicker) {
        closeColorPicker();
    }
}

// Drawing functions
function startDrawing(e) {
    if (!isEnabled) return;
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
    closeColorPicker();
}

function draw(e) {
    if (!isDrawing || !isEnabled) return;
    ctx.lineWidth = isErasing ? 100 : 5;
    ctx.lineCap = 'round';
    
    if (colorPicker.style.opacity === '1') {
        closeColorPicker();
    }
    
    if (isErasing) {
        ctx.globalCompositeOperation = 'destination-out';
        eraserCursor.style.display = 'block';
        eraserCursor.style.left = e.clientX + 'px';
        eraserCursor.style.top = e.clientY + 'px';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = penColor;
        eraserCursor.style.display = 'none';
    }
    
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveCurrentState();
        eraserCursor.style.display = 'none';
    }
}

function saveCurrentState() {
    drawingHistory.splice(currentHistoryIndex + 1);
    drawingHistory.push(canvas.toDataURL());
    currentHistoryIndex = drawingHistory.length - 1;
}

function loadState(index) {
    if (index >= 0 && index < drawingHistory.length) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = drawingHistory[index];
        currentHistoryIndex = index;
    }
}

function toggleToolbar() {
    const buttons = toolbarContainer.children;
    if (isEnabled) {
        for (let i = 0; i < buttons.length - 1; i++) {
            buttons[i].style.transform = 'scale(1)';
        }
    } else {
        for (let i = 0; i < buttons.length - 1; i++) {
            buttons[i].style.transform = 'scale(0)';
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingHistory = [];
        currentHistoryIndex = -1;
    }
}

function closePen() {
    // Remove active class from canvas to make it click-through
    canvas.classList.remove('active');
    canvas.style.pointerEvents = 'none';
    penIcon.style.background = 'rgba(0, 0, 0, 0.5)';
    penIcon.style.pointerEvents = 'auto'; // Ensure pen icon is always clickable
    
    // Keep the pen icon area clickable by disabling click-through
    window.electronAPI.setIgnoreMouseEvents(false);
    
    // Reposition for non-kiosk mode (will use larger offset on macOS)
    positionPenIcon();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingHistory = [];
    currentHistoryIndex = -1;
    
    const buttons = toolbarContainer.children;
    for (let i = 0; i < buttons.length - 1; i++) {
        buttons[i].style.transform = 'scale(0)';
    }
    
    isErasing = false;
    document.getElementById('eraser').style.background = 'rgba(0, 0, 0, 0.5)';
    document.getElementById('pen').style.background = 'rgba(0, 0, 0, 0.5)';
    
    closeColorPicker();
    colorPicker.style.pointerEvents = 'none';
    colorPicker.style.left = '-100px';
    colorPicker.style.top = '-100px';
    eraserCursor.style.display = 'none';
    
    penIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="pointer-events: none;">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>`;
}

function openPen() {
    // Add active class to canvas to make it interactive
    canvas.classList.add('active');
    canvas.style.pointerEvents = 'auto';
    penIcon.style.background = 'rgba(255, 0, 0, 0.5)';
    penIcon.style.pointerEvents = 'auto'; // Ensure pen icon is always clickable
    
    // Reposition for kiosk mode (will use smaller offset on macOS)
    positionPenIcon();
    
    const buttons = toolbarContainer.children;
    for (let i = 0; i < buttons.length - 1; i++) {
        buttons[i].style.transform = 'scale(1)';
    }
    
    loadState(currentHistoryIndex);
    
    penIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="pointer-events: none;">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>`;
    
    updateColorPickerPosition();
    setTimeout(() => {
        updateColorPickerPosition();
        colorPicker.style.pointerEvents = 'auto';
    }, 350);
}

function toggleDrawing() {
    isEnabled = !isEnabled;
    
    if (!isEnabled) {
        closePen();
        window.electronAPI.closeDrawing();
    } else {
        openPen();
        // Tell main process to enable drawing (make window focusable)
        window.electronAPI.openDrawing();
    }
    
    toggleToolbar();
}

// Event listeners for pen icon
penIcon.addEventListener('click', toggleDrawing);

// Handle mouse enter/leave on pen icon to disable click-through when hovering
penIcon.addEventListener('mouseenter', () => {
    if (!isEnabled) {
        window.electronAPI.setIgnoreMouseEvents(false);
    }
});

penIcon.addEventListener('mouseleave', () => {
    if (!isEnabled) {
        window.electronAPI.setIgnoreMouseEvents(true);
    }
});

// Handle mouse enter/leave on toolbar
toolbarContainer.addEventListener('mouseenter', () => {
    if (!isEnabled) {
        window.electronAPI.setIgnoreMouseEvents(false);
    }
});

toolbarContainer.addEventListener('mouseleave', () => {
    if (!isEnabled) {
        window.electronAPI.setIgnoreMouseEvents(true);
    }
});

// Event listeners for toolbar buttons
document.getElementById('pen').addEventListener('click', () => {
    isEnabled = !isEnabled;
    isErasing = false;
    toggleToolbar();
    document.getElementById('pen').style.background = isEnabled ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)';
});

document.getElementById('eraser').addEventListener('click', () => {
    isErasing = !isErasing;
    document.getElementById('eraser').style.background = isErasing ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)';
    if (!isErasing) {
        eraserCursor.style.display = 'none';
    }
});

document.getElementById('color').addEventListener('click', (e) => {
    e.stopPropagation();
    if (colorPicker.style.opacity === '1') {
        closeColorPicker();
    } else {
        isErasing = false;
        document.getElementById('eraser').style.background = 'rgba(0, 0, 0, 0.5)';
        eraserCursor.style.display = 'none';
        
        colorPicker.style.opacity = '1';
        updateColorPickerPosition();
    }
});

// Mouse events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', (e) => {
    if (isEnabled && isErasing && !isDrawing) {
        eraserCursor.style.display = 'block';
        eraserCursor.style.left = e.clientX + 'px';
        eraserCursor.style.top = e.clientY + 'px';
    } else if (!isErasing || !isEnabled) {
        eraserCursor.style.display = 'none';
    }
    draw(e);
});
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Document-level mouse events
document.addEventListener('mousemove', (e) => {
    if (isDrawing && isEnabled) {
        if (isErasing) {
            eraserCursor.style.display = 'block';
            eraserCursor.style.left = e.clientX + 'px';
            eraserCursor.style.top = e.clientY + 'px';
        }
        draw(e);
    }
});

document.addEventListener('mouseup', (e) => {
    if (isDrawing && isEnabled) {
        stopDrawing();
    }
});

document.addEventListener('mousedown', (e) => {
    setTimeout(() => {
        const colorBtn = document.getElementById('color');
        const isColorButtonArea = colorBtn.contains(e.target) || e.target === colorBtn || 
                                  colorPicker.contains(e.target) || e.target === colorPicker;
        
        if (!isColorButtonArea) {
            handleOutsideClick(e);
        }
    }, 50);
});

// Touch events
canvas.addEventListener('touchstart', (e) => {
    if (!isEnabled) return;
    e.preventDefault();
    
    if (colorPicker.style.opacity === '1') {
        closeColorPicker();
    }
    
    startDrawing(e.touches[0]);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    
    if (colorPicker.style.opacity === '1') {
        closeColorPicker();
    }
    
    const isPalmTouch = (touch.radiusX > 20 || touch.radiusY > 20);
    const wasErasing = isErasing;
    
    if (isPalmTouch) {
        isErasing = true;
        eraserCursor.style.display = 'block';
        eraserCursor.style.left = touch.clientX + 'px';
        eraserCursor.style.top = touch.clientY + 'px';
    } else if (isEnabled && isErasing) {
        eraserCursor.style.display = 'block';
        eraserCursor.style.left = touch.clientX + 'px';
        eraserCursor.style.top = touch.clientY + 'px';
    } else {
        eraserCursor.style.display = 'none';
    }
    
    draw(touch);
    isErasing = wasErasing;
});

canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

document.addEventListener('touchmove', (e) => {
    if (isDrawing && isEnabled) {
        e.preventDefault();
        const touch = e.touches[0];
        
        if (isErasing) {
            eraserCursor.style.display = 'block';
            eraserCursor.style.left = touch.clientX + 'px';
            eraserCursor.style.top = touch.clientY + 'px';
        }
        
        draw(touch);
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (isDrawing && isEnabled) {
        stopDrawing();
    }
});

document.addEventListener('touchstart', (e) => {
    const colorBtn = document.getElementById('color');
    const isColorButtonArea = colorBtn.contains(e.target) || e.target === colorBtn || 
                              colorPicker.contains(e.target) || e.target === colorPicker;
    const isCanvas = e.target === canvas || canvas.contains(e.target);
    
    if (isCanvas && colorPicker.style.opacity === '1') {
        closeColorPicker();
    }
    
    if (!isColorButtonArea) {
        handleOutsideClick(e);
    }
});

// Listen for IPC messages from main process
window.electronAPI.onToggleDrawing((event, enabled) => {
    isEnabled = enabled;
    if (!isEnabled) {
        closePen();
    } else {
        openPen();
    }
    toggleToolbar();
});

window.electronAPI.onClearCanvas(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingHistory = [];
    currentHistoryIndex = -1;
});

// Listen for display changes (fullscreen, taskbar hide, resolution change)
window.electronAPI.onDisplayChanged(() => {
    resizeCanvas();
    positionPenIcon();
});

// Handle presentation clicker keys (close pen and forward to app below)
document.addEventListener('keydown', (e) => {
    // Only handle keys when drawing is enabled
    if (!isEnabled) return;
    
    // Presentation navigation keys
    const presentationKeys = [
        'Escape',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'PageUp', 'PageDown',
        'Home', 'End',
        ' ', // Space bar
        'Enter'
    ];
    
    if (presentationKeys.includes(e.key)) {
        console.log('Presentation key pressed:', e.key);
        
        // Close the pen first
        isEnabled = false;
        closePen();
        
        // Tell main process to close drawing and make window non-focusable
        window.electronAPI.closeDrawing();
        
        // Don't prevent default - let the key pass through after window loses focus
        // The key will go to the underlying app since window becomes non-focusable
    }
}, true); // Use capture phase to ensure we get the event

// Initialize
colorPicker.value = penColor;
document.getElementById('color').style.background = penColor;
penIcon.style.background = 'rgba(0, 0, 0, 0.5)';
document.getElementById('pen').style.background = 'rgba(0, 0, 0, 0.5)';
updateColorPickerPosition();
