// Create and inject the pen icon
const penIcon = document.createElement('div');
penIcon.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="pointer-events: none;">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
`;
penIcon.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.5);
    padding: 10px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 2147483647;
    color: white;
    font-size: 14px;
    font-family: system-ui !important;
    line-height: 0px !important;
`;

// Create canvas for drawing
const canvas = document.createElement('canvas');
canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483646;
`;

// Create and inject the toolbar container
const toolbarContainer = document.createElement('div');
toolbarContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 80px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    z-index: 2147483647;
    font-family: system-ui !important;
    line-height: 0px !important;
`;

// Create toolbar buttons
const buttons = [
    { id: 'pen', icon: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>' },
    { id: 'color', icon: '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>' },
    { id: 'eraser', icon: '<path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53c-.79.78-2.05.78-2.84 0L3.56 14.93c-.79-.78-.79-2.04 0-2.82l8.86-8.86c.78-.78 2.05-.78 2.84 0l.98.97zm-2.83 11.31L9 10.46 5.16 14.3l4.41 4.41c.39.39 1.02.39 1.41 0l2.83-2.83c.19-.19.3-.45.3-.71s-.11-.52-.3-.71z"/>' },
    // { id: 'prevSlide', icon: '<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>' },
    // { id: 'nextSlide', icon: '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>' }
].reverse(); // Reverse the array to maintain visual order when appending

let drawingHistory = [];
let currentHistoryIndex = -1;

buttons.forEach(btn => {
    const button = document.createElement('div');
    button.id = btn.id;
    button.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="pointer-events: none;">${btn.icon}</svg>`;
    button.style.cssText = `
        background: rgba(0, 0, 0, 0.5);
        padding: 10px !important;
        border-radius: 50%;
        cursor: pointer;
        color: white;
        transform: scale(0);
        transition: transform 0.3s ease;
        font-size: 14px;
        font-family: system-ui !important;
        line-height: 0px !important;
    `;
    toolbarContainer.insertBefore(button, toolbarContainer.firstChild);
});

// Create a colour picker
const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.style.cssText = `
    position: fixed;
    z-index: 2147483644;
    width: 44px;
    height: 44px;
    padding: 0px !important;
    border: none;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    opacity: 0;
`;

// Function to update color picker position
function updateColorPickerPosition() {
    const colorBtn = toolbarContainer.querySelector('#color');
    const colorBtnRect = colorBtn.getBoundingClientRect();
    colorPicker.style.left = `${colorBtnRect.left}px`;
    colorPicker.style.top = `${colorBtnRect.top}px`;
}

// Update position when window resizes
window.addEventListener('resize', updateColorPickerPosition);

// Update position when toolbar becomes visible
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.style.transform === 'scale(1)') {
            updateColorPickerPosition();
        }
    });
});

observer.observe(toolbarContainer.querySelector('#color'), {
    attributes: true,
    attributeFilter: ['style']
});

updateColorPickerPosition();

var penColor = "red";
colorPicker.addEventListener('input', () => {
    penColor = colorPicker.value;

    // Set the color of the color picker buttons background to match
    toolbarContainer.querySelector('#color').style.background = penColor;

});

toolbarContainer.appendChild(colorPicker);

// Drawing variables
let isDrawing = false;
let isEnabled = false;
const ctx = canvas.getContext('2d');

// Handle window resize
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Drawing functions
function startDrawing(e) {
    if (!isEnabled) return;
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
}

function draw(e) {
    if (!isDrawing || !isEnabled) return;
    ctx.lineWidth = isErasing ? 50 : 5;
    ctx.lineCap = 'round';
    
    if (isErasing) {
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = penColor;
    }
    
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveCurrentState();
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
        for (let i = 1; i < buttons.length; i++) {
            buttons[i].style.transform = 'scale(1)';
        }
    } else {
        for (let i = 1; i < buttons.length; i++) {
            buttons[i].style.transform = 'scale(0)';
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingHistory = [];
        currentHistoryIndex = -1;
    }
}

// Toggle drawing mode
function toggleDrawing() {
    isEnabled = !isEnabled;

    if (!isEnabled) {
        closePen();
    } else {
        openPen();
    }
}

function closePen() {

    canvas.style.pointerEvents = isEnabled ? 'auto' : 'none';
    penIcon.style.background = isEnabled ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingHistory = [];
    currentHistoryIndex = -1;

    // Hide the toolbar
    const buttons = toolbarContainer.children;
    for (let i = 1; i < buttons.length; i++) {
        buttons[i].style.transform = 'scale(0)';
    }

    // Turn off eraser
    isErasing = false;
    toolbarContainer.querySelector('#eraser').style.background = 'rgba(0, 0, 0, 0.5)';
    toolbarContainer.querySelector('#pen').style.background = 'rgba(0, 0, 0, 0.5)';

    // Change the pen icon back to normal
    penIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="pointer-events: none;">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>`;
}

function openPen() {
    canvas.style.pointerEvents = isEnabled ? 'auto' : 'none';
    penIcon.style.background = isEnabled ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)';

    // Show the toolbar
    const buttons = toolbarContainer.children;
    for (let i = 1; i < buttons.length; i++) {
        buttons[i].style.transform = 'scale(1)';
    }

    // Load the last saved state
    loadState(currentHistoryIndex);

    penIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="pointer-events: none;">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>`;

    // Wait 1 second and run updateColorPickerPosition to fix the color picker position
    setTimeout(updateColorPickerPosition, 350);
    setTimeout(updateColorPickerPosition, 500);
    setTimeout(updateColorPickerPosition, 1000);
}

// Initialize
let isErasing = false;
document.body.appendChild(toolbarContainer);
document.body.appendChild(canvas);
resizeCanvas();

// Event listeners
toolbarContainer.querySelector('#pen').addEventListener('click', () => {
    isEnabled = !isEnabled;
    isErasing = false;
    toggleToolbar();
    toolbarContainer.querySelector('#pen').style.background = isEnabled ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)';
});

toolbarContainer.querySelector('#pen').addEventListener('touchstart', (e) => {
    e.preventDefault();
    isEnabled = !isEnabled;
    isErasing = false;
    toggleToolbar();
    toolbarContainer.querySelector('#pen').style.background = isEnabled ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)';
});

toolbarContainer.querySelector('#eraser').addEventListener('click', () => {
    isErasing = !isErasing;
    toolbarContainer.querySelector('#eraser').style.background = isErasing ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)';
});

toolbarContainer.querySelector('#eraser').addEventListener('touchstart', (e) => {
    e.preventDefault();
    isErasing = !isErasing;
    toolbarContainer.querySelector('#eraser').style.background = isErasing ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)';
});

// toolbarContainer.querySelector('#undo').addEventListener('click', () => {
//     loadState(currentHistoryIndex - 1);
// });

// toolbarContainer.querySelector('#redo').addEventListener('click', () => {
//     loadState(currentHistoryIndex + 1);
// });

// toolbarContainer.querySelector('#prevSlide').addEventListener('click', () => {
//     const leftArrow = new KeyboardEvent('keydown', {
//         key: 'ArrowLeft',
//         keyCode: 37,
//         code: 'ArrowLeft',
//         bubbles: true,
//         cancelable: true
//     });
//     document.dispatchEvent(leftArrow);
// });

// toolbarContainer.querySelector('#nextSlide').addEventListener('click', () => {
//     const rightArrow = new KeyboardEvent('keydown', {
//         key: 'ArrowRight',
//         keyCode: 39,
//         code: 'ArrowRight',
//         bubbles: true,
//         cancelable: true
//     });
//     document.dispatchEvent(rightArrow);
// });

window.addEventListener('resize', resizeCanvas);

// Mouse events
penIcon.addEventListener('click', toggleDrawing);
penIcon.addEventListener('touchstart', (e) => {
    e.preventDefault();
    toggleDrawing();
});
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch events
// Touch events
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); // Prevent scrolling
    startDrawing(e.touches[0]); // Pass the first touch point
});

canvas.addEventListener("touchmove", (e) => {
e.preventDefault();
draw(e.touches[0]);
});

canvas.addEventListener("touchend", stopDrawing);
  canvas.addEventListener("touchcancel", stopDrawing);

// On esc close pen and other keys
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || 
        e.key === 'ArrowLeft' || 
        e.key === 'ArrowRight' || 
        e.key === 'ArrowUp' || 
        e.key === 'ArrowDown' ||
        e.key === 'PageUp' ||
        e.key === 'PageDown') {

        isEnabled = false;
        closePen();
    }
});

document.body.appendChild(penIcon);

// Continually check with a loop if a button with aria-label "Enter full screen." exises
// If it does, delete its click handler and replace it with one that fullscreens the whole
// document instead of just part
function checkForFullScreenButton() {
    const fullScreenButton = document.querySelector('button[aria-label="Enter full screen."]');
    if (fullScreenButton) {
        fullScreenButton.onclick = () => {
            document.documentElement.requestFullscreen();
        };
    }
    setTimeout(checkForFullScreenButton, 1000);
}

checkForFullScreenButton();

// Set the colour picker to red
colorPicker.value = penColor;
penIcon.style.background = 'rgba(0, 0, 0, 0.5)';
toolbarContainer.querySelector('#pen').style.background = 'rgba(0, 0, 0, 0.5)';
toolbarContainer.querySelector('#color').style.background = penColor;