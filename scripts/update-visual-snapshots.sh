#!/bin/bash

# Script to download Linux visual regression test snapshots from CI and commit them
# This is needed because snapshots are platform-specific (macOS vs Linux)

set -e

echo "📥 Downloading visual test snapshots from latest CI run..."

# Get the latest workflow run
LATEST_RUN=$(gh run list --workflow=Tests --limit 1 --json databaseId --jq '.[0].databaseId')

if [ -z "$LATEST_RUN" ]; then
    echo "❌ No workflow runs found"
    exit 1
fi

echo "   Found run: $LATEST_RUN"

# Create temp directory for artifacts
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Download the visual-test-snapshots artifact
echo "   Downloading artifact..."
gh run download $LATEST_RUN --name visual-test-snapshots --dir $TEMP_DIR 2>&1 || {
    echo "⚠️  Artifact not found. Make sure the workflow has completed and generated snapshots."
    echo "   You may need to wait for the workflow to finish, or run with --update-snapshots first."
    exit 1
}

# Check if snapshots were downloaded
if [ ! -d "$TEMP_DIR/tests/visual/regression.spec.js-snapshots" ]; then
    echo "❌ Snapshots directory not found in artifact"
    exit 1
fi

# Backup existing snapshots (optional)
if [ -d "tests/visual/regression.spec.js-snapshots" ]; then
    echo "   Backing up existing snapshots..."
    BACKUP_DIR="tests/visual/regression.spec.js-snapshots.backup.$(date +%Y%m%d_%H%M%S)"
    cp -r tests/visual/regression.spec.js-snapshots "$BACKUP_DIR"
    echo "   Backup saved to: $BACKUP_DIR"
fi

# Replace snapshots
echo "   Replacing snapshots..."
rm -rf tests/visual/regression.spec.js-snapshots
cp -r "$TEMP_DIR/tests/visual/regression.spec.js-snapshots" tests/visual/

# Count snapshots
SNAPSHOT_COUNT=$(find tests/visual/regression.spec.js-snapshots -name "*.png" | wc -l | tr -d ' ')
echo "   ✓ Found $SNAPSHOT_COUNT snapshot(s)"

# Check git status
if git diff --quiet tests/visual/regression.spec.js-snapshots/ 2>/dev/null; then
    echo "ℹ️  No changes to commit (snapshots are already up to date)"
    exit 0
fi

# Show what will be committed
echo ""
echo "📋 Changes to be committed:"
git status --short tests/visual/regression.spec.js-snapshots/

# Ask for confirmation (optional - can be skipped with --yes flag)
if [ "$1" != "--yes" ]; then
    echo ""
    read -p "Commit these changes? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted"
        exit 1
    fi
fi

# Commit
echo ""
echo "💾 Committing snapshots..."
git add tests/visual/regression.spec.js-snapshots/
git commit -m "Update visual regression test snapshots from CI (Linux)

- Generated on Linux in GitHub Actions
- Replaces macOS-specific snapshots
- Ensures CI tests pass consistently"

echo ""
echo "✅ Snapshots committed successfully!"
echo ""
echo "📤 Next step: Push to GitHub"
echo "   git push origin main"

