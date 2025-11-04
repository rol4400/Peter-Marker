# Automatic Updates Setup

Peter Marker Desktop includes automatic update functionality using GitHub Releases and electron-updater.

## How It Works

1. **Startup Check**: The app checks for updates 3 seconds after launch (non-blocking)
2. **Manual Check**: Users can check for updates via the tray menu: "Check for Updates"
3. **Download Prompt**: When an update is available, users are prompted to download
4. **Install on Quit**: Updates are installed automatically when the app quits

## For Users

### Checking for Updates
- **Automatic**: Updates check automatically on app startup
- **Manual**: Right-click the tray icon → "Check for Updates"

### Installing Updates
1. When prompted, click "Download" to download the update
2. When download completes, click "Restart Now" or "Later"
3. If you choose "Later", the update will install next time you quit the app

## For Developers

### Publishing Updates

#### Prerequisites
1. **GitHub Personal Access Token** with `repo` permissions
2. **Self-signed certificate** for macOS (see below)
3. **Version number** bumped in `package.json`

#### Build and Publish Steps

1. **Bump Version** in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Set GitHub Token** (environment variable):
   ```bash
   # Mac/Linux
   export GH_TOKEN="your_github_personal_access_token"
   
   # Windows PowerShell
   $env:GH_TOKEN="your_github_personal_access_token"
   ```

3. **Build and Publish**:
   ```bash
   # Mac (creates DMG and ZIP, publishes to GitHub)
   npm run build:mac
   
   # Windows (creates NSIS installer, publishes to GitHub)
   npm run build:win
   
   # Both platforms
   npm run build:all
   ```

4. **electron-builder** will:
   - Build the installers
   - Create a GitHub Release with the version tag
   - Upload installers as release assets
   - Generate `latest-mac.yml` and `latest.yml` for auto-updater

#### Manual GitHub Release

If you prefer to create releases manually:

1. Build without publishing:
   ```bash
   npm run build:mac -- --publish never
   ```

2. Go to GitHub → Releases → "Create new release"
3. Tag version: `v1.0.1`
4. Upload files from `dist/`:
   - Mac: `Peter-Marker-1.0.1-mac.zip`, `Peter-Marker-1.0.1-universal.dmg`, `latest-mac.yml`
   - Windows: `Peter-Marker-Setup-1.0.1.exe`, `latest.yml`

### macOS Self-Signed Certificate

For development and testing, use a self-signed certificate:

#### Create Certificate (Mac Only)

1. **Open Keychain Access**
2. **Create Certificate**:
   - Keychain Access menu → Certificate Assistant → Create a Certificate
   - Name: `Peter Marker Developer`
   - Identity Type: `Self-Signed Root`
   - Certificate Type: `Code Signing`
   - Check "Let me override defaults"
   - Click Continue through all dialogs
   - Make sure "Keychain" is set to "login"

3. **Trust Certificate**:
   - Find the certificate in Keychain Access
   - Double-click it
   - Expand "Trust"
   - Set "Code Signing" to "Always Trust"
   - Close window (enter password when prompted)

#### Configure electron-builder

The certificate is already configured in `package.json`:

```json
"mac": {
  "identity": "Peter Marker Developer",
  "hardenedRuntime": true,
  "gatekeeperAssess": false
}
```

#### Environment Variables

For production builds with Apple Developer certificate:

```bash
# Apple Developer ID certificate
export CSC_NAME="Developer ID Application: Your Name (TEAMID)"

# Or use certificate file
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate_password"
```

For self-signed (development):

```bash
export CSC_NAME="Peter Marker Developer"
```

### Windows Code Signing

For Windows, you can:

1. **Self-signed** (development):
   - Windows will show "Unknown publisher" warning
   - Users must click "More info" → "Run anyway"

2. **Commercial certificate** (production):
   - Purchase from DigiCert, Sectigo, etc.
   - Set environment variables:
     ```powershell
     $env:CSC_LINK="path\to\certificate.pfx"
     $env:CSC_KEY_PASSWORD="certificate_password"
     ```

### Update Channel Configuration

The app uses the default `latest` channel. To use beta/alpha channels:

```javascript
// In main.js
autoUpdater.channel = 'beta'; // or 'alpha'
```

Then create releases with `-beta` or `-alpha` suffix:
- `v1.0.1-beta.1`
- `v1.0.1-alpha.1`

## Testing Updates Locally

### Using a Local Update Server

1. **Install simple HTTP server**:
   ```bash
   npm install -g http-server
   ```

2. **Build the app**:
   ```bash
   npm run build:mac -- --publish never
   ```

3. **Create update files** in a test directory:
   ```
   updates/
     latest-mac.yml
     Peter-Marker-1.0.1-mac.zip
   ```

4. **Start server**:
   ```bash
   cd updates
   http-server -p 8080 --cors
   ```

5. **Point updater to local server** (in `main.js`):
   ```javascript
   if (process.env.NODE_ENV === 'development') {
       autoUpdater.setFeedURL({
           provider: 'generic',
           url: 'http://localhost:8080'
       });
   }
   ```

### Testing with GitHub Releases

1. Create a test repository
2. Update `package.json` → `build.publish.repo`
3. Publish a version
4. Install that version
5. Publish a newer version
6. Test update flow

## Troubleshooting

### "Update check failed"
- Verify GitHub repo and owner in `package.json`
- Check internet connection
- Ensure GitHub Release exists with proper assets

### "Update download failed"
- Check `latest-mac.yml` or `latest.yml` has correct file URLs
- Verify release assets are public (not in private repo without token)

### Mac: "App is damaged"
- Certificate issue - verify certificate is trusted in Keychain
- Try: `xattr -cr /Applications/Peter\ Marker.app`
- For self-signed, users may need to right-click → Open (first time)

### Windows: SmartScreen warning
- Expected with self-signed certificates
- Users: Click "More info" → "Run anyway"
- Production: Use commercial code signing certificate

## Update Flow Diagram

```
App Startup
    ↓
Check for Updates (after 3s delay)
    ↓
Update Available? → No → Done
    ↓ Yes
Show Dialog: "Download update?"
    ↓
User clicks "Download"
    ↓
Download in background (with progress)
    ↓
Download Complete
    ↓
Show Dialog: "Restart to install?"
    ↓
User clicks "Restart Now"
    ↓
App Quits → Installer Runs → App Restarts
```

## Security Notes

- **HTTPS Only**: electron-updater only downloads over HTTPS
- **Signature Verification**: Updates are verified against the certificate
- **No Downgrade**: electron-updater prevents downgrading to older versions
- **User Control**: Users can choose when to download and install

## Release Checklist

- [ ] Bump version in `package.json`
- [ ] Update `CHANGELOG.md` with changes
- [ ] Commit changes: `git commit -am "Release v1.0.1"`
- [ ] Set `GH_TOKEN` environment variable
- [ ] Build: `npm run build:all`
- [ ] Verify GitHub Release was created
- [ ] Verify release assets uploaded correctly
- [ ] Test update on clean install of previous version
- [ ] Announce update to users

## Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [Code Signing (macOS)](https://www.electron.build/code-signing)
- [Publishing to GitHub](https://www.electron.build/configuration/publish#githuboptions)
