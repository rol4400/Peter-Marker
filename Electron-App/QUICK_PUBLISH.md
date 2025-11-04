# Quick Publish Guide

## First Time Setup (One Time Only)

1. **Create GitHub Token**
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scope: ☑️ **repo**
   - Copy token

2. **Set Token in PowerShell**
   ```powershell
   $env:GH_TOKEN="ghp_your_token_here"
   ```
   
   Or permanently add to profile:
   ```powershell
   Add-Content $PROFILE.CurrentUserAllHosts "`n`$env:GH_TOKEN=`"ghp_your_token_here`""
   ```

3. **Verify Token**
   ```powershell
   echo $env:GH_TOKEN
   ```

## Every Release

1. **Bump version** in `package.json`
   ```json
   "version": "1.0.1"  // Increment from 1.0.0
   ```

2. **Build and publish**
   ```powershell
   npm run build:win
   ```

3. **Check GitHub**
   - https://github.com/rol4400/Peter-Marker/releases
   - Verify new release `v1.0.1` was created
   - Verify files uploaded (`.exe` and `latest.yml`)

## Done!

Users will automatically get the update on their next app launch.

## Build Output to Look For

```
✓ Building...
✓ signing file
✓ publishing  publisher=Github (owner: rol4400, repo: Peter-Marker)
✓ uploading   file=Peter Marker Setup 1.0.1.exe
✓ published to GitHub
```

If you don't see "published to GitHub", check:
- `echo $env:GH_TOKEN` returns your token
- Using `npm run build:win` (not `npm run build:win:local`)

## Scripts

- `npm run build:win` - Build and publish Windows installer
- `npm run build:mac` - Build and publish Mac installer
- `npm run build:win:local` - Build Windows installer locally (no publish)
- `npm run build:mac:local` - Build Mac installer locally (no publish)

## More Info

- [GITHUB_TOKEN.md](GITHUB_TOKEN.md) - Detailed token setup
- [AUTO_UPDATE.md](AUTO_UPDATE.md) - How updates work
- [RELEASE_WORKFLOW.md](RELEASE_WORKFLOW.md) - Complete release process
