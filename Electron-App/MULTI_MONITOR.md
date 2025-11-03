# Multi-Monitor Support

Peter Marker Desktop automatically follows your mouse cursor across multiple displays. This ensures the drawing pen is always available on whichever monitor you're actively using.

## How It Works

The app uses intelligent cursor tracking to detect which display your mouse is on:

1. **Automatic Detection**: Every 100ms, the app checks your cursor position
2. **Smart Following**: If your cursor moves to a different display, the overlay window seamlessly repositions itself
3. **Full Coverage**: The overlay always covers the entire display where your cursor is located
4. **Zero Configuration**: Works automatically without any setup required

## Technical Implementation

### Cursor Tracking
```javascript
// Polls cursor position every 100ms
const cursorPoint = screen.getCursorScreenPoint();
const displayWithCursor = screen.getDisplayNearestPoint(cursorPoint);
```

### Window Repositioning
When your cursor moves to a different display:
- The overlay window moves to that display's bounds
- The pen icon repositions itself at the bottom of the new display
- Canvas is cleared and resized to match the new display dimensions

### Performance
- **Polling Interval**: 100ms provides smooth following without excessive CPU usage
- **Efficient Checks**: Only repositions when cursor actually changes displays
- **Cross-Platform**: Uses Electron's screen API, fully compatible with Mac and Windows

## Display Configurations Supported

✅ **Laptop + External Monitor** (side-by-side or extended)  
✅ **Multiple External Displays** (2, 3, or more monitors)  
✅ **Mixed Resolutions** (e.g., 1920x1080 + 3840x2160)  
✅ **Different Arrangements** (horizontal, vertical, diagonal)  
✅ **Dynamic Changes** (hot-plugging monitors)

## Teaching Use Cases

### Scenario 1: Classroom with Projector
- **Setup**: Laptop display + projector
- **Behavior**: When you move your mouse to the projector screen, the pen follows automatically
- **Benefit**: Annotate directly on the projected presentation without manually switching

### Scenario 2: Multi-Monitor Workstation
- **Setup**: Primary monitor + secondary monitor
- **Behavior**: Open PowerPoint on one monitor, use pen on either display as needed
- **Benefit**: Flexible workflow across multiple screens

### Scenario 3: Hybrid Teaching
- **Setup**: Laptop for notes + large display for students
- **Behavior**: Switch between displays seamlessly during lesson
- **Benefit**: Control which screen you're annotating without interrupting your flow

## Testing Multi-Monitor Support

### Quick Test
1. Connect a second monitor to your computer
2. Launch Peter Marker Desktop
3. Open the pen (click tray icon or floating pen)
4. Move your mouse cursor from one monitor to the other
5. **Expected**: The pen overlay should follow your cursor to the new display

### Detailed Test
1. **Initial Position**: Verify pen starts on primary display
2. **Cursor Movement**: Move mouse slowly to second display edge
3. **Transition**: Watch overlay window reposition smoothly
4. **Drawing Test**: Try drawing on both displays
5. **Display Changes**: Try:
   - Changing display arrangement (System Settings > Displays)
   - Disconnecting/reconnecting a monitor
   - Changing resolution on one display

### Troubleshooting

**Pen doesn't follow cursor to second display:**
- Make sure both displays are properly configured in your OS
- Check that the displays are set to "Extended" mode, not "Mirrored"
- Restart the app and try again

**Pen appears on wrong display:**
- The app uses the display nearest to your cursor position
- Move your cursor fully onto the target display
- Wait 100ms for the next tracking poll cycle

**Performance issues with many displays:**
- The 100ms polling interval should handle 2-4 displays smoothly
- If you experience lag with 5+ displays, please report the issue

## Code Reference

**Main Process** (`main.js`):
- `followMouseDisplay()` - Detects cursor display and repositions window
- `updateWindowToDisplay(display)` - Moves window to specified display
- `startMouseTracking()` - Begins cursor tracking on app launch
- `stopMouseTracking()` - Cleanup on app quit

**Renderer Process** (`renderer.js`):
- Listens for `display-changed` IPC event
- Automatically repositions pen icon when display changes
- Resizes canvas to match new display dimensions

## Platform Compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| macOS | ✅ Fully Supported | Works with Spaces, Mission Control, and full-screen apps |
| Windows | ✅ Fully Supported | Works with virtual desktops and task view |
| Display Scaling | ✅ Supported | Automatically handles different DPI/scaling settings |

## Future Enhancements

Potential improvements for future versions:
- [ ] Remember pen position per display
- [ ] Display-specific color/tool preferences
- [ ] Keyboard shortcut to manually move pen to specific display
- [ ] Option to disable auto-following and manually select display
- [ ] Visual indicator showing which display is active

## Related Documentation

- [Fullscreen Handling](FULLSCREEN_HANDLING.md) - How pen positions itself in fullscreen mode
- [Click-Through Fix](CLICK_THROUGH_FIX.md) - How clicks pass through to apps below
- [Project Summary](PROJECT_SUMMARY.md) - Complete technical overview
