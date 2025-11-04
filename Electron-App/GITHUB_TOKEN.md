# GitHub Token Setup

To publish builds to GitHub releases, you need a Personal Access Token.

## Create GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `Peter Marker Builds`
4. Expiration: Choose duration (90 days, 1 year, or no expiration)
5. Select scope: **☑️ repo** (Full control of private repositories)
6. Click **"Generate token"**
7. **Copy the token immediately** (you won't be able to see it again)

## Set Token in PowerShell

**For Current Session** (temporary):
```powershell
$env:GH_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Permanently** (recommended):
```powershell
# Add to your PowerShell profile
$profilePath = $PROFILE.CurrentUserAllHosts
if (!(Test-Path $profilePath)) {
    New-Item -Path $profilePath -Type File -Force
}
Add-Content $profilePath "`n`$env:GH_TOKEN=`"ghp_your_token_here`""
```

Then reload:
```powershell
. $PROFILE
```

## Verify Token is Set

```powershell
echo $env:GH_TOKEN
```

Should output: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Build and Publish

Once token is set:

```powershell
# Build for Windows and publish to GitHub
npm run build:win

# Or build locally without publishing
npm run build:win:local
```

## What Happens

When you run `npm run build:win`, electron-builder will:
1. ✅ Build the Windows installer
2. ✅ Create a GitHub Release with tag `v1.0.0`
3. ✅ Upload `Peter Marker Setup 1.0.0.exe` to the release
4. ✅ Upload `latest.yml` (update metadata)
5. ✅ Users will see the update available

## First Time Publishing

The first time you publish, you'll create the initial release. Subsequent builds will create new releases with incremented versions.

**Workflow**:
1. Current version: `1.0.0` (in package.json)
2. Build and publish: `npm run build:win`
3. GitHub Release created: `v1.0.0`
4. Users install version `1.0.0`
5. Make changes, bump version to `1.0.1` in package.json
6. Build and publish: `npm run build:win`
7. GitHub Release created: `v1.0.1`
8. Users with `1.0.0` get notified and update automatically on next launch

## Troubleshooting

### Token Not Found
**Error**: `GH_TOKEN is not set`

**Solution**:
```powershell
$env:GH_TOKEN="your_token_here"
npm run build:win
```

### Token Invalid
**Error**: `Bad credentials`

**Solution**:
- Regenerate token on GitHub
- Make sure scope includes `repo`
- Copy new token and set again

### No Release Created
**Checklist**:
- ✅ Token set: `echo $env:GH_TOKEN`
- ✅ Using publish script: `npm run build:win` (not `npm run build:win:local`)
- ✅ Check build output for "publishing" messages
- ✅ Check GitHub releases page: https://github.com/rol4400/Peter-Marker/releases

### Build Output

Look for these lines in the output:
```
• publishing  publisher=Github (owner: rol4400, repo: Peter-Marker)
• uploading   file=Peter Marker Setup 1.0.0.exe
• published to GitHub
```

If you don't see "publishing", the token isn't set or `--publish always` flag is missing.
