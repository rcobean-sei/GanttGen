# Code Signing Setup Guide

This guide walks you through setting up code signing and notarization for the GanttGen macOS app.

## Prerequisites

- Active Apple Developer Program membership ($99/year)
- Access to your Apple ID
- macOS machine (for certificate generation)

## Step 1: Get Your Apple Developer Credentials

### 1.1 Find Your Team ID

1. Go to https://developer.apple.com/account
2. Click on "Membership" in the sidebar
3. Find your **Team ID** (10-character string like `ABC123XYZ4`)
4. Save this - you'll need it later

### 1.2 Create a Developer ID Application Certificate

1. Go to https://developer.apple.com/account/resources/certificates
2. Click the **+** button to create a new certificate
3. Select **Developer ID Application** (under "Software")
4. Click **Continue**
5. Follow the instructions to create a Certificate Signing Request (CSR):
   - Open **Keychain Access** on your Mac
   - Menu: **Keychain Access** → **Certificate Assistant** → **Request a Certificate from a Certificate Authority**
   - Enter your email address
   - Common Name: "GanttGen Code Signing"
   - Select: **Saved to disk**
   - Click **Continue** and save the CSR file
6. Upload the CSR file to Apple Developer portal
7. Download the certificate (.cer file)
8. Double-click to install it in Keychain Access

### 1.3 Export Certificate as P12

1. Open **Keychain Access**
2. In the left sidebar, select **My Certificates**
3. Find your "Developer ID Application" certificate
4. Right-click → **Export**
5. Save as: `GanttGen-Certificate.p12`
6. Set a **strong password** - you'll need this for GitHub Secrets
7. Save the P12 file securely

### 1.4 Create App-Specific Password

1. Go to https://appleid.apple.com/account/manage
2. Under **Sign-In and Security**, click **App-Specific Passwords**
3. Click **+** to generate a new password
4. Label it: "GanttGen Notarization"
5. Copy the generated password (format: `xxxx-xxxx-xxxx-xxxx`)
6. Save it securely - you can't view it again!

## Step 2: Set Up GitHub Secrets

Go to your GitHub repository:
1. Settings → Secrets and variables → Actions
2. Click **New repository secret** for each of the following:

### Required Secrets:

| Secret Name | Value | How to Get It |
|------------|-------|---------------|
| `MACOS_CERTIFICATE` | Base64-encoded P12 file | Run: `base64 -i GanttGen-Certificate.p12 | pbcopy` |
| `MACOS_CERTIFICATE_PWD` | Password for P12 file | The password you set when exporting |
| `APPLE_ID` | Your Apple ID email | Your developer account email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password | From Step 1.4 above |
| `APPLE_TEAM_ID` | Your 10-character Team ID | From Step 1.1 above |

### Setting MACOS_CERTIFICATE:

```bash
# Convert P12 to base64
base64 -i GanttGen-Certificate.p12 | pbcopy

# The base64 string is now in your clipboard
# Paste it as the value for MACOS_CERTIFICATE secret
```

## Step 3: Verify Setup

### 3.1 Test Locally (Optional)

Before pushing to GitHub, you can test signing locally:

```bash
cd electron-app

# Set environment variables
export CSC_LINK="/path/to/GanttGen-Certificate.p12"
export CSC_KEY_PASSWORD="your-p12-password"
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="ABC123XYZ4"

# Build
npm run build:mac
```

### 3.2 Test on GitHub Actions

1. Push changes to `main` branch or create a tag:
   ```bash
   git tag v0.6.0-test
   git push origin v0.6.0-test
   ```

2. Watch the GitHub Actions workflow:
   - Go to Actions tab
   - Watch for "Import Apple Developer Certificate" step
   - Check for signing/notarization logs

### 3.3 Verify Signed App

After download, verify the signature:

```bash
# Check code signature
codesign -vvv --deep --strict GanttGen.app

# Check notarization
spctl -a -vvv -t install GanttGen.app

# Expected output: "accepted" and "source=Notarized Developer ID"
```

## Step 4: Update DMG Instructions

Once signing is working, you can remove the `Fix-GanttGen.command` workaround:

1. Edit `electron-app/package.json`
2. Remove from DMG contents:
   ```json
   {
     "x": 270,
     "y": 100,
     "type": "file",
     "path": "build/Fix-GanttGen.command"
   }
   ```

3. Update `build/DMG_README.txt` to remove xattr instructions

## Troubleshooting

### "Certificate not found" Error

- Make sure `MACOS_CERTIFICATE` is properly base64 encoded
- Verify `MACOS_CERTIFICATE_PWD` matches the P12 password
- Check certificate is "Developer ID Application" (not "Mac App Distribution")

### Notarization Fails

- Verify `APPLE_ID` is correct
- Check `APPLE_APP_SPECIFIC_PASSWORD` is valid (regenerate if unsure)
- Confirm `APPLE_TEAM_ID` matches your account
- Ensure hardened runtime is enabled in package.json

### "Invalid entitlements" Error

- Check `build/entitlements.mac.plist` has required entitlements
- For Electron apps, you need JIT and unsigned memory entitlements

### Notarization Takes Too Long

- Notarization can take 5-30 minutes
- Check status at: https://developer.apple.com/account/resources/notarization

### Local Signing Works, GitHub Actions Fails

- Ensure all secrets are set in GitHub repository settings
- Check secret names match exactly (case-sensitive)
- Verify base64 encoding didn't introduce line breaks

## Cost Summary

- **Apple Developer Program**: $99/year (required)
- **Certificate Management**: Free (included)
- **Notarization**: Free (unlimited)
- **GitHub Actions**: Free for public repos, paid for private

## Security Notes

- **Never commit** certificates or passwords to git
- Store P12 files securely (encrypted backup)
- Rotate app-specific passwords annually
- Use GitHub environment protection for additional security
- Consider separate certificates for development vs. distribution

## Next Steps

Once code signing is working:

1. ✅ Update release notes (already done in workflow)
2. ✅ Test installation on fresh macOS system
3. ✅ Remove Fix-GanttGen.command workaround
4. ✅ Consider adding Windows code signing (separate process)

## Resources

- [Apple Developer - Code Signing](https://developer.apple.com/support/code-signing/)
- [Apple Developer - Notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [electron-builder - Code Signing](https://www.electron.build/code-signing)
- [GitHub Actions - Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Support

If you encounter issues:

1. Check GitHub Actions logs for specific error messages
2. Verify all secrets are set correctly
3. Test signing locally first
4. Review electron-builder documentation
5. Check Apple Developer portal for certificate status
