# Apple Code Signing for GanttGen Tauri App

This document describes the code signing and notarization setup for macOS builds of the GanttGen Tauri application.

## Overview

Code signing ensures that:
- Users can verify the app comes from a trusted source
- The app hasn't been tampered with since it was signed
- macOS Gatekeeper will allow the app to run without warnings
- The app can be distributed via the Mac App Store (if applicable)

## Requirements

### Apple Developer Account

You need an active Apple Developer account with:
- A valid Developer ID Application certificate
- (Optional) Notarization credentials for Gatekeeper approval

### Signing Certificate

The signing certificate must be:
- A valid Developer ID Application certificate (for distribution outside the Mac App Store)
- Or a Mac App Store distribution certificate (for App Store distribution)
- Exported as a .p12 file with a password

## GitHub Secrets Configuration

The following secrets must be configured in your GitHub repository at **Settings → Secrets and variables → Actions**:

### Required Secrets

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `MAC_CERT_P12_BASE64` | Base64-encoded .p12 certificate | See "Exporting Certificate" below |
| `MAC_CERT_PASSWORD` | Password for the .p12 file | Password you set when exporting the certificate |
| `APPLE_SIGNING_IDENTITY` | Certificate common name | See "Finding Certificate Identity" below |

### Optional Secrets (for Notarization)

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `APPLE_ID` | Apple ID email address | Your Apple Developer account email |
| `APPLE_PASSWORD` | App-specific password | Generate at https://appleid.apple.com |
| `APPLE_TEAM_ID` | 10-character team identifier | Found in Apple Developer portal |

## Setup Instructions

### 1. Exporting Your Certificate

On a Mac with your Apple Developer certificate installed:

1. Open **Keychain Access**
2. Select the **login** keychain
3. Find your "Developer ID Application" certificate
4. Right-click and select **Export**
5. Save as **certificate.p12**
6. Set a strong password when prompted
7. Convert to base64:
   ```bash
   # On macOS
   base64 -i certificate.p12 -o certificate.p12.base64
   
   # On Linux (use -w 0 to disable line wrapping)
   base64 -w 0 -i certificate.p12 -o certificate.p12.base64
   ```
8. Copy the contents of `certificate.p12.base64`

**Security Note:** Keep your .p12 file and password secure. Never commit them to the repository.

### 2. Finding Your Certificate Identity

Your signing identity is the common name of your certificate. To find it:

```bash
security find-identity -v -p codesigning
```

Look for a line like:
```
1) ABCDEF1234567890 "Developer ID Application: Your Company Name (TEAM123456)"
```

The quoted string is your `APPLE_SIGNING_IDENTITY`.

### 3. Adding Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `MAC_CERT_P12_BASE64`
   - Value: Contents of `certificate.p12.base64` file
   - Click **Add secret**
5. Repeat for `MAC_CERT_PASSWORD` and `APPLE_SIGNING_IDENTITY`

### 4. (Optional) Setting Up Notarization

Notarization is required to avoid Gatekeeper warnings on macOS 10.15 Catalina and later.

#### Generate App-Specific Password

1. Go to https://appleid.apple.com
2. Sign in with your Apple ID
3. Navigate to **Security → App-Specific Passwords**
4. Click **Generate Password**
5. Name it "GanttGen Notarization"
6. Copy the generated password

#### Find Your Team ID

1. Go to https://developer.apple.com/account
2. Navigate to **Membership**
3. Your Team ID is displayed (10 alphanumeric characters)

#### Add Notarization Secrets

Add the following secrets to GitHub:
- `APPLE_ID`: Your Apple Developer email
- `APPLE_PASSWORD`: The app-specific password
- `APPLE_TEAM_ID`: Your 10-character team ID

## Configuration Details

### Tauri Configuration

The `tauri.conf.json` file includes macOS-specific settings:

```json
"macOS": {
  "signingIdentity": null,
  "providerShortName": null,
  "entitlements": null,
  "minimumSystemVersion": "10.13"
}
```

**Note:** Setting `signingIdentity` to `null` tells Tauri to use the `APPLE_SIGNING_IDENTITY` environment variable, which is set during the CI/CD build. This allows for dynamic configuration without hardcoding credentials in the repository.

## How Code Signing Works in CI/CD

The GitHub Actions workflow (`.github/workflows/build-tauri-app.yml`) automatically handles code signing:

### Build Process

1. **Certificate Import** (for macOS builds only)
   - Creates a temporary keychain
   - Decodes the base64 certificate
   - Imports the certificate into the keychain
   - Configures keychain access for codesign

2. **Build with Signing**
   - Tauri build process uses the imported certificate
   - Signs the app bundle with the Developer ID
   - Uses the `APPLE_SIGNING_IDENTITY` environment variable

3. **Notarization** (if credentials provided)
   - Uploads the signed app to Apple's notarization service
   - Waits for approval (usually 1-5 minutes)
   - Staples the notarization ticket to the app

4. **Cleanup**
   - Removes the temporary keychain
   - Deletes temporary certificate files

### Workflow Configuration

The workflow only performs signing when:
- Building on `macos-latest` runners
- NOT in pull request builds (to protect secrets)
- All required secrets are available

## Verifying Signed Builds

After a build completes, you can verify the signature:

### Download and Check Signature

1. Download the artifact from GitHub Actions
2. Extract the .app or .dmg file
3. Verify the signature:

```bash
# For .app bundles
codesign --verify --deep --strict --verbose=2 GanttGen.app

# Check signing details
codesign -dv --verbose=4 GanttGen.app

# For notarized apps, check stapled ticket
stapler validate GanttGen.app
```

### Expected Output

**Successful Signing:**
```
GanttGen.app: valid on disk
GanttGen.app: satisfies its Designated Requirement
```

**Notarization (if enabled):**
```
The validate action worked!
```

## Troubleshooting

### Certificate Import Fails

**Symptom:** "security: SecKeychainItemImport: The specified item already exists in the keychain"

**Solution:** The workflow creates a fresh temporary keychain each time, so this shouldn't occur. If it does, check that the cleanup step is running.

### Signing Identity Not Found

**Symptom:** "No identity found for signing"

**Solution:**
1. Verify `APPLE_SIGNING_IDENTITY` matches exactly (including spaces and parentheses)
2. Check that `MAC_CERT_P12_BASE64` is valid base64
3. Ensure `MAC_CERT_PASSWORD` is correct

### Notarization Fails

**Symptom:** "Unable to notarize app"

**Solution:**
1. Verify `APPLE_ID` is correct
2. Ensure `APPLE_PASSWORD` is an app-specific password (not your account password)
3. Check `APPLE_TEAM_ID` is the correct 10-character ID
4. Make sure your Apple Developer account has active membership

### Certificate Expired

**Symptom:** "Certificate has expired"

**Solution:**
1. Renew your Apple Developer certificate
2. Export the new certificate as .p12
3. Update `MAC_CERT_P12_BASE64` in GitHub Secrets

## Security Best Practices

### Protecting Secrets

- **Never** commit certificates or passwords to the repository
- Use GitHub Secrets for all sensitive data
- Rotate app-specific passwords periodically
- Limit access to repository secrets to administrators

### Certificate Management

- Store the original .p12 file in a secure password manager
- Keep a backup of the certificate
- Document the certificate expiration date
- Set up reminders to renew before expiration

### Access Control

- Only enable code signing on the main branch and release builds
- Disable signing for pull requests to protect secrets
- Use branch protection rules to prevent unauthorized changes

## Local Development

Code signing is **not required** for local development. The workflow only signs builds in CI/CD.

To test code signing locally (optional):

```bash
# Export your signing identity
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM123456)"

# Build the app
cd tauri-app
npm run tauri:build

# The app will be signed if the certificate is in your keychain
```

## CI/CD Integration

### Automatic Signing on Push

Code signing happens automatically when:
- Code is pushed to the main branch
- Tags are pushed (for releases)
- Workflow is manually triggered

### Skipping Code Signing

To temporarily skip code signing (for testing):
1. Comment out the "Import Apple Code Signing Certificate" step in the workflow
2. Or remove the secrets from the repository (signing will be skipped automatically)

## References

- [Apple Code Signing Documentation](https://developer.apple.com/documentation/security/code_signing_services)
- [Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Tauri Bundle Configuration](https://tauri.app/v1/guides/building/macos)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Support

For issues with code signing:
1. Check the GitHub Actions logs for detailed error messages
2. Review the troubleshooting section above
3. Verify all secrets are correctly configured
4. Ensure your Apple Developer certificate is valid and not expired

## Certificate Renewal Checklist

When your certificate is nearing expiration:

- [ ] Renew certificate in Apple Developer portal
- [ ] Download new certificate
- [ ] Export as .p12 file
- [ ] Convert to base64
- [ ] Update `MAC_CERT_P12_BASE64` in GitHub Secrets
- [ ] Update `MAC_CERT_PASSWORD` if changed
- [ ] Test a build to verify new certificate works
- [ ] Document new expiration date
