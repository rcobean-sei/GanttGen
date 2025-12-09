# macOS Code Signing and Notarization Guide

This guide walks you through setting up code signing and notarization for distributing macOS apps outside the Mac App Store.

---

## Prerequisites

- **Apple Developer Program membership** ($99/year) - https://developer.apple.com/programs/
- **Xcode** installed on your Mac
- **Keychain Access** app (built into macOS)

---

## Part 1: Create a Developer ID Application Certificate

### Step 1: Open Xcode and Access Certificates

1. Open **Xcode**
2. Go to **Xcode → Settings** (or press `Cmd + ,`)
3. Click the **Accounts** tab
4. Select your Apple ID on the left
5. Select your Team (should show "Agent" or "Admin" role)
6. Click **Manage Certificates...** button

### Step 2: Create the Certificate

1. In the certificates window, click the **+** button in the bottom-left corner
2. Select **"Developer ID Application"** from the dropdown
3. Click **Create**
4. Xcode will create the certificate and install it in your Keychain

> **Important**: You must select "Developer ID Application" - NOT "Apple Development" or "Apple Distribution". Only Developer ID works for apps distributed outside the App Store.

### Step 3: Verify the Certificate in Keychain Access

1. Open **Keychain Access** (search in Spotlight)
2. In the left sidebar, select **login** keychain
3. Click **My Certificates** in the Category section
4. Look for: **"Developer ID Application: Your Name (TEAMID)"**
5. Click the arrow next to it to expand - you should see a **private key** underneath

If you see the certificate with a private key, you're ready for the next step.

---

## Part 2: Export the Certificate as .p12

### Step 1: Export from Keychain Access

1. In **Keychain Access**, find your certificate:
   ```
   Developer ID Application: Your Name (XXXXXXXXXX)
   ```
2. **Right-click** on the certificate (the one with the key icon when expanded)
3. Select **"Export..."**
4. Choose a save location and filename (e.g., `DeveloperIDApplication.p12`)
5. **Format**: Personal Information Exchange (.p12)
6. Click **Save**

### Step 2: Set a Password

1. You'll be prompted to create a password for the .p12 file
2. **Enter a strong password** and remember it - you'll need this for `MAC_CERT_PASSWORD`
3. Click **OK**
4. Enter your Mac login password to authorize the export

### Step 3: Convert to Base64

Open Terminal and run:

```bash
base64 -i /path/to/DeveloperIDApplication.p12 | pbcopy
```

This copies the base64-encoded certificate to your clipboard.

---

## Part 3: Set Up GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

### Required Secrets for Code Signing

| Secret Name | Value | How to Get It |
|------------|-------|---------------|
| `MAC_CERT_P12_BASE64` | The base64 string from Step 3 above | Paste from clipboard |
| `MAC_CERT_PASSWORD` | The password you set when exporting | The password you created |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: Your Name (TEAMID)` | Copy exact name from Keychain Access |

### How to Get APPLE_SIGNING_IDENTITY

1. Open **Keychain Access**
2. Find your Developer ID Application certificate
3. **Double-click** to open certificate details
4. The **Common Name** field shows the exact string you need
5. It should look like: `Developer ID Application: Ryder Cobean (922HNV9NMD)`

**Copy this exactly** - including spaces and parentheses.

---

## Part 4: Set Up Notarization

Notarization is required for macOS 10.15+ to avoid Gatekeeper warnings.

### Step 1: Create an App-Specific Password

1. Go to https://appleid.apple.com/
2. Sign in with your Apple ID
3. In the **Sign-In and Security** section, click **App-Specific Passwords**
4. Click **Generate an app-specific password**
5. Enter a label (e.g., "GitHub Actions Notarization")
6. Click **Create**
7. **Copy the password** (format: xxxx-xxxx-xxxx-xxxx) - you won't see it again!

### Step 2: Find Your Team ID

Option A - From Apple Developer Portal:
1. Go to https://developer.apple.com/account
2. Click **Membership** in the sidebar
3. Your **Team ID** is shown (10 characters, e.g., `922HNV9NMD`)

Option B - From your certificate:
1. The Team ID is in parentheses in your certificate name
2. `Developer ID Application: Your Name (TEAMID)` ← this part

### Step 3: Add Notarization Secrets to GitHub

Add these additional secrets:

| Secret Name | Value | Example |
|------------|-------|---------|
| `APPLE_ID` | Your Apple Developer account email | `developer@example.com` |
| `APPLE_PASSWORD` | The app-specific password from Step 1 | `xxxx-xxxx-xxxx-xxxx` |
| `APPLE_TEAM_ID` | Your 10-character Team ID | `922HNV9NMD` |

---

## Part 5: Verify Your Setup

### Check Certificate Locally

Run this in Terminal to verify your certificate:

```bash
# List all Developer ID certificates
security find-identity -v -p codesigning | grep "Developer ID"
```

You should see output like:
```
1) ABC123... "Developer ID Application: Your Name (TEAMID)"
```

### Check the .p12 File Contains the Right Certificate

```bash
# Decode and check the .p12 (replace with your actual base64)
echo "YOUR_BASE64_STRING" | base64 --decode > temp.p12

# Import to a temporary keychain and list
security create-keychain -p temp temp.keychain
security import temp.p12 -k temp.keychain -P "YOUR_P12_PASSWORD" -T /usr/bin/codesign
security find-identity -v -p codesigning temp.keychain

# Cleanup
security delete-keychain temp.keychain
rm temp.p12
```

You should see "Developer ID Application" in the output.

---

## Part 6: Complete GitHub Secrets Checklist

After completing all steps, you should have these 6 secrets configured:

### Code Signing (Required)
- [ ] `MAC_CERT_P12_BASE64` - Base64-encoded .p12 certificate
- [ ] `MAC_CERT_PASSWORD` - Password for the .p12 file
- [ ] `APPLE_SIGNING_IDENTITY` - Exact certificate name

### Notarization (Required for distribution)
- [ ] `APPLE_ID` - Your Apple Developer email
- [ ] `APPLE_PASSWORD` - App-specific password
- [ ] `APPLE_TEAM_ID` - Your 10-character Team ID

---

## Troubleshooting

### "App is damaged and can't be opened"

This means the app is either:
- Not signed at all
- Signed with wrong certificate type (Apple Development instead of Developer ID)
- Signature was stripped during packaging

**Fix**: Verify `APPLE_SIGNING_IDENTITY` matches exactly what's in Keychain Access.

### "Developer cannot be verified" (with Open Anyway option)

This means the app IS signed with Developer ID but NOT notarized.

**Fix**: Set up notarization secrets (Part 4).

### No "Developer ID" in certificate list

You may not have created a Developer ID certificate yet.

**Fix**: Follow Part 1 to create one in Xcode.

### "The specified item could not be found in the keychain"

The certificate in the .p12 file doesn't match `APPLE_SIGNING_IDENTITY`.

**Fix**:
1. Re-export the correct certificate from Keychain Access
2. Make sure you're exporting "Developer ID Application" not "Apple Development"
3. Update `MAC_CERT_P12_BASE64` with the new base64 string

### Certificate shows "This certificate was signed by an unknown authority"

The certificate chain is incomplete or the root CA is missing.

**Fix**: Open Keychain Access and make sure you have:
- Your Developer ID Application certificate
- Developer ID Certification Authority (intermediate)
- Apple Root CA

If missing, download from https://www.apple.com/certificateauthority/

---

## Quick Reference: Certificate Types

| Certificate Type | Use Case | Gatekeeper Behavior |
|-----------------|----------|---------------------|
| **Developer ID Application** | Distribute outside App Store | ✅ Accepted (with notarization) |
| Apple Development | Development/testing only | ❌ "Damaged" error |
| Apple Distribution | App Store only | ❌ "Damaged" error |
| 3rd Party Mac Developer | App Store only | ❌ "Damaged" error |

**Always use "Developer ID Application" for apps distributed outside the Mac App Store.**

---

## After Setup: Testing the Build

1. Push a commit to `main` branch (not a PR)
2. Check the GitHub Actions workflow
3. Look for the "Debug - List certificates in keychain" step
4. Verify it shows "Developer ID Application" certificate
5. Download the DMG artifact
6. On a Mac, double-click to mount and run the app
7. It should open without "damaged" or "unverified developer" warnings

---

*Last updated: December 2024*
