# Self-Signed Certificate Guide for macOS

This guide walks you through creating a self-signed certificate for code signing Peter Marker on macOS.

## Why You Need This

- **Development & Testing**: Sign builds on your Mac without an Apple Developer account ($99/year)
- **Auto-Updates**: electron-updater requires signed apps for secure updates
- **macOS Security**: Prevents "App is damaged" or "unidentified developer" warnings

## Quick Setup (5 minutes)

### Option 1: Automated Script

Run the provided setup script:

```bash
cd Electron-App
chmod +x setup-cert-mac.sh
./setup-cert-mac.sh
```

The script will:
1. Create a self-signed certificate named "Peter Marker Developer"
2. Import it to your login keychain
3. Open Keychain Access for you to trust it
4. Set up environment variables

### Option 2: Manual Setup

#### Step 1: Create Certificate

1. Open **Keychain Access** (Applications → Utilities → Keychain Access)

2. From the menu: **Keychain Access → Certificate Assistant → Create a Certificate**

3. Fill in the details:
   - **Name**: `Peter Marker Developer`
   - **Identity Type**: `Self-Signed Root`
   - **Certificate Type**: `Code Signing`
   - Check ☑️ **Let me override defaults**

4. Click **Continue**

5. On the "Certificate Information" screen:
   - Serial Number: (leave default)
   - Validity Period: `3650` days (10 years)
   - Click **Continue**

6. On the "Key Pair Information" screens:
   - Key Size: `2048 bits`
   - Algorithm: `RSA`
   - Click **Continue** through both screens

7. On the "Key Usage Extension" screen:
   - Check: ☑️ **Digital Signature**
   - Click **Continue**

8. On the "Extended Key Usage Extension" screen:
   - Check: ☑️ **Code Signing**
   - Click **Continue**

9. On the "Basic Constraints Extension" screen:
   - Check: ☐ **This certificate is a certificate authority**
   - Click **Continue**

10. On the "Subject Alternate Name Extension" screen:
    - Click **Continue** (leave empty)

11. On the "Specify a Location" screen:
    - Keychain: `login`
    - Click **Continue**

12. Enter your password and click **Allow**

#### Step 2: Trust the Certificate

1. In **Keychain Access**, find the certificate: `Peter Marker Developer`

2. **Double-click** the certificate to open it

3. Expand the **Trust** section

4. For **Code Signing**, select: **Always Trust**

5. Close the window

6. Enter your password when prompted

7. Verify the certificate shows a blue plus sign (✓) indicating it's trusted

#### Step 3: Configure Environment

Add to your `~/.zshrc` or `~/.bash_profile`:

```bash
export CSC_NAME="Peter Marker Developer"
```

Then reload:

```bash
source ~/.zshrc  # or source ~/.bash_profile
```

## Verify Setup

Check if the certificate is available:

```bash
security find-identity -v -p codesigning
```

You should see output like:
```
1) XXXXXXXXXX "Peter Marker Developer"
```

## Building with the Certificate

Now you can build the app:

```bash
cd Electron-App
npm run build:mac
```

The build will be signed with your self-signed certificate.

## Distribution Notes

### Installing on Your Own Mac

The signed app will work without issues on your Mac since you trust the certificate.

### Installing on Other Macs

Users will see a security warning on first launch:

**"Peter Marker.app" cannot be opened because the developer cannot be verified.**

To install:
1. Right-click the app → **Open**
2. Click **Open** in the dialog
3. The app will open and be trusted from now on

### Alternative: Disable Gatekeeper (Not Recommended)

```bash
xattr -cr /Applications/Peter\ Marker.app
```

## Production: Apple Developer Certificate

For public distribution, get an Apple Developer certificate:

1. **Join Apple Developer Program**: https://developer.apple.com ($99/year)

2. **Create Certificate**:
   - Go to: https://developer.apple.com/account/resources/certificates
   - Create: "Developer ID Application"
   - Download and install the certificate

3. **Configure electron-builder**:
   ```bash
   export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"
   ```

4. **Build**:
   ```bash
   npm run build:mac
   ```

5. **Notarize** (optional but recommended):
   ```bash
   npm install -g @electron/notarize
   # Add notarization to package.json afterSign hook
   ```

## Troubleshooting

### Certificate Not Found

**Error**: `No signing identity found`

**Solution**:
1. Verify certificate exists: `security find-identity -v -p codesigning`
2. Check environment variable: `echo $CSC_NAME`
3. Make sure certificate name matches exactly: `Peter Marker Developer`

### Certificate Not Trusted

**Error**: `The code signature is not valid for use in process using Library Validation`

**Solution**:
1. Open Keychain Access
2. Find "Peter Marker Developer"
3. Double-click → Trust → Code Signing → Always Trust
4. Restart Terminal

### App Shows "Damaged"

**Error**: `"Peter Marker.app" is damaged and can't be opened`

**Solution**:
```bash
xattr -cr /Applications/Peter\ Marker.app
```

Or right-click → Open (first time only)

### Build Still Not Signing

**Try**:
1. Delete and recreate certificate
2. Clean build: `rm -rf dist node_modules && npm install`
3. Set CSC_NAME in same terminal session: `export CSC_NAME="Peter Marker Developer"; npm run build:mac`

## Security Notes

### Self-Signed vs Apple Certificate

| Feature | Self-Signed | Apple Certificate |
|---------|-------------|-------------------|
| Cost | Free | $99/year |
| Your Mac | ✅ Works | ✅ Works |
| Other Macs | ⚠️ Warning on first launch | ✅ No warnings |
| App Store | ❌ Not allowed | ✅ Allowed |
| Auto-updates | ✅ Works | ✅ Works |
| Notarization | ❌ Not possible | ✅ Possible |

### Why Self-Signed is Good Enough for Development

- **Testing**: Perfect for testing auto-updates locally
- **Personal Use**: If you're the only user, no issues
- **Small Teams**: Distribute to team members with instructions
- **Low Budget**: Free alternative to Apple Developer Program

### When to Upgrade to Apple Certificate

- **Public Distribution**: App will be used by many people
- **Professional Image**: No security warnings for users
- **App Store**: Required for Mac App Store submission
- **Notarization**: Want the extra security verification

## Resources

- [Electron Code Signing](https://www.electron.build/code-signing)
- [Apple Developer Program](https://developer.apple.com/programs/)
- [electron-builder Documentation](https://www.electron.build/)
- [Keychain Access Guide](https://support.apple.com/guide/keychain-access)

## Next Steps

After setting up the certificate:

1. ✅ Build the app: `npm run build:mac`
2. ✅ Test installation: Install the DMG from `dist/`
3. ✅ Test updates: See [AUTO_UPDATE.md](AUTO_UPDATE.md)
4. 📚 Read: [BUILD_CHECKLIST.md](BUILD_CHECKLIST.md) for production builds
