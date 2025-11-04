# Release Workflow

Step-by-step guide for publishing new versions of Peter Marker with automatic updates.

## Prerequisites Checklist

- [ ] GitHub Personal Access Token with `repo` scope
- [ ] Self-signed certificate (Mac) or code signing cert (production)
- [ ] Local build tested and working
- [ ] All changes committed to git

## Quick Release (Development)

### 1. Bump Version

Edit `package.json`:
```json
"version": "1.0.1"  // Increment from 1.0.0
```

### 2. Set GitHub Token

```bash
# Mac/Linux
export GH_TOKEN="ghp_your_token_here"

# Windows PowerShell
$env:GH_TOKEN="ghp_your_token_here"
```

### 3. Build and Publish

```bash
cd Electron-App

# Mac only
npm run build:mac

# Windows only
npm run build:win

# Both platforms (if on Mac)
npm run build:all
```

electron-builder will:
- Build the installers
- Create a GitHub Release tagged `v1.0.1`
- Upload all files to the release
- Users will be notified of the update

## Detailed Release Process

### Step 1: Prepare Release

#### Update Version Number

**package.json**:
```json
{
  "name": "peter-marker-desktop",
  "version": "1.1.0",  // <-- Update this
  ...
}
```

Version numbering guide:
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features
- **Patch** (1.0.0 → 1.0.1): Bug fixes

#### Document Changes (Optional)

Create or update `CHANGELOG.md`:
```markdown
## [1.1.0] - 2025-11-04

### Added
- Automatic updates via GitHub releases
- Multi-monitor support with cursor tracking

### Fixed
- Click-through now works properly
- Keyboard shortcuts work from floating pen

### Changed
- Improved fullscreen positioning
```

#### Commit Changes

```bash
git add package.json CHANGELOG.md
git commit -m "Release v1.1.0"
git push origin main
```

### Step 2: Build

#### Set Environment Variables

**macOS Certificate**:
```bash
# Self-signed
export CSC_NAME="Peter Marker Developer"

# Apple Developer
export CSC_NAME="Developer ID Application: Your Name (TEAMID)"
```

**GitHub Token**:
```bash
export GH_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Verify**:
```bash
echo $CSC_NAME
echo $GH_TOKEN
```

#### Run Build

```bash
cd Electron-App

# Build for your platform
npm run build:mac   # macOS
npm run build:win   # Windows

# Build for both (Mac only, requires wine for Windows)
npm run build:all
```

Watch for:
- ✅ "signing file" - Certificate is working
- ✅ "publishing" - Uploading to GitHub
- ✅ "published to GitHub" - Release created

#### Build Output

Check `dist/` folder:

**macOS**:
- `Peter-Marker-1.1.0-universal.dmg` - Installer
- `Peter-Marker-1.1.0-mac.zip` - Update package
- `latest-mac.yml` - Update metadata

**Windows**:
- `Peter-Marker-Setup-1.1.0.exe` - Installer
- `latest.yml` - Update metadata

### Step 3: Verify GitHub Release

1. Go to: https://github.com/rol4400/Peter-Marker/releases

2. You should see a new release: **v1.1.0**

3. Verify assets:
   - ☑️ `.dmg` file (Mac installer)
   - ☑️ `.zip` file (Mac update)
   - ☑️ `latest-mac.yml` (Mac update info)
   - ☑️ `.exe` file (Windows installer)
   - ☑️ `latest.yml` (Windows update info)

4. Edit release notes if needed:
   - Click "Edit release"
   - Add description of changes
   - Mark as pre-release if beta
   - Click "Update release"

### Step 4: Test Update

#### Install Previous Version

1. Download previous release installer
2. Install it
3. Launch the app

#### Trigger Update Check

**Method 1**: Manual check
- Right-click tray icon
- "Check for Updates"
- Should show: "Update Available"

**Method 2**: Restart app
- Quit app
- Launch again
- Update check happens after 3 seconds

#### Verify Update Flow

1. **Update Dialog**: "Version 1.1.0 is available. Download?"
2. Click **Download**
3. **Progress**: Watch download in terminal/logs
4. **Install Dialog**: "Version 1.1.0 downloaded. Restart?"
5. Click **Restart Now**
6. App quits and reopens with new version

#### Confirm Version

Check app version:
- Right-click tray → About (if you add this)
- Or check in Activity Monitor / Task Manager

### Step 5: Announce Release

**Options**:
1. Email to users
2. Slack/Discord announcement
3. Social media post
4. Website update

**Template**:
```
🎉 Peter Marker v1.1.0 Released!

New features:
- Automatic updates - stay current effortlessly
- Multi-monitor support - pen follows your cursor

Bug fixes:
- Click-through now works properly
- Keyboard shortcuts improved

Download: https://github.com/rol4400/Peter-Marker/releases/latest

Existing users: Check for updates in the tray menu!
```

## Troubleshooting

### Build Fails: No Certificate

**Error**: `Code signing failed: No identity found`

**Solution**:
```bash
# Verify certificate
security find-identity -v -p codesigning

# Set CSC_NAME
export CSC_NAME="Peter Marker Developer"

# Try again
npm run build:mac
```

### Publish Fails: GitHub Token

**Error**: `GH_TOKEN is not set`

**Solution**:
```bash
# Generate token: https://github.com/settings/tokens
# Scope: repo (full control)

export GH_TOKEN="ghp_your_token_here"
npm run build:mac
```

### Update Not Detected

**Issue**: App says "No updates available"

**Check**:
1. Current version < Released version?
2. GitHub release exists?
3. `latest-mac.yml` uploaded?
4. Release is published (not draft)?

**Debug**:
```bash
# Check auto-updater logs (Mac)
cat ~/Library/Logs/peter-marker-desktop/main.log

# Check auto-updater logs (Windows)
cat %USERPROFILE%\AppData\Roaming\peter-marker-desktop\logs\main.log
```

### Update Download Fails

**Issue**: Download starts but fails

**Check**:
1. GitHub release assets are public
2. `.zip` file uploaded (not just `.dmg`)
3. `latest-mac.yml` has correct URLs
4. Internet connection stable

## Advanced: Beta Releases

### Setup Beta Channel

**main.js**:
```javascript
// After autoUpdater configuration
if (process.env.BETA_UPDATES) {
    autoUpdater.channel = 'beta';
}
```

### Publish Beta

**Version with beta suffix**:
```json
"version": "1.2.0-beta.1"
```

**Build**:
```bash
export BETA_UPDATES=true
npm run build:mac
```

**GitHub Release**:
- Tag: `v1.2.0-beta.1`
- Mark as "pre-release"

### Users Opt Into Beta

**Modify their main.js** before building:
```javascript
autoUpdater.channel = 'beta';
```

Or use environment variable:
```bash
export BETA_UPDATES=true
open -a "Peter Marker"
```

## Tips

### Faster Builds

**Skip DMG** (only build ZIP for updates):
```json
// package.json
"mac": {
  "target": ["zip"]
}
```

Then build:
```bash
npm run build:mac
```

### Local Testing

**Don't publish to GitHub**:
```bash
npm run build:mac -- --publish never
```

**Use local update server**:
```bash
cd dist
python3 -m http.server 8080

# In main.js (development only)
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'http://localhost:8080'
});
```

### Automated Releases

**Use GitHub Actions**:

`.github/workflows/release.yml`:
```yaml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build:mac
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Then trigger with:
```bash
git tag v1.2.0
git push --tags
```

## Release Checklist

Before each release:

- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated (optional)
- [ ] Changes committed and pushed
- [ ] CSC_NAME environment variable set
- [ ] GH_TOKEN environment variable set
- [ ] Local build tested
- [ ] Build completed successfully
- [ ] GitHub release created
- [ ] All assets uploaded correctly
- [ ] Tested update from previous version
- [ ] Release notes added on GitHub
- [ ] Users notified (if applicable)

## Resources

- [Semantic Versioning](https://semver.org/)
- [electron-updater Docs](https://www.electron.build/auto-update)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [electron-builder Publishing](https://www.electron.build/configuration/publish)
