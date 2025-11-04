# Automatic Updates Setup

Peter Marker Desktop includes automatic update functionality using GitHub Releases and electron-updater.

## How It Works

1. **Startup Check**: The app checks for updates 3 seconds after launch (silent, non-blocking)
2. **Silent Download**: If an update is available, it downloads in the background
3. **Install on Next Launch**: Update installs automatically the next time you start the app
4. **Manual Check**: Users can manually check via the tray menu: "Check for Updates"

**Key Behavior**:
- ✅ Updates check and download on startup
- ✅ Updates install on next app launch (not on quit)
- ✅ No interruptions during usage
- ✅ Perfect for users who leave the app running and just reboot their PC

## For Users

### Automatic Updates (Silent)
- App checks for updates on every startup
- Downloads happen in the background without prompting
- Next time you launch the app, the update is installed
- **No dialogs or interruptions during normal use**

### Manual Update Check
- Right-click the tray icon → "Check for Updates"
- You'll see a message if an update is available or if you're on the latest version
- Update downloads in background
- Installs on next app launch

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
   
   See [GITHUB_TOKEN.md](GITHUB_TOKEN.md) for detailed setup instructions.
   
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
   
   # Build locally without publishing (for testing)
   npm run build:win:local
   npm run build:mac:local
   ```

4. **electron-builder** will:
   - Build the installers
   - Create a GitHub Release with the version tag (e.g., `v1.0.1`)
   - Upload installers as release assets
   - Generate `latest-mac.yml` and `latest.yml` for auto-updater
   - Look for "published to GitHub" in the build output

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
App Launch #1 (v1.0.0)
    ↓
Check for Updates (after 3s delay, silent)
    ↓
Update Available? → No → Continue using app
    ↓ Yes (v1.0.1 available)
Download silently in background
    ↓
Download Complete (ready to install)
    ↓
User continues working...
    ↓
User quits app or reboots PC
    ↓
    ↓
App Launch #2
    ↓
Update installs automatically
    ↓
App starts with v1.0.1
    ↓
Continue checking for updates on each launch


Manual Check (via tray menu):
    ↓
User clicks "Check for Updates"
    ↓
Update Available? → No → Show "Up to date" dialog
    ↓ Yes
Show "Update available, downloading..." dialog
    ↓
Download in background
    ↓
Will install on next launch
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
