# Setting Up Test Badges on GitHub

This guide walks you through the steps to get test badges working on your GitHub repository.

## Prerequisites

- GitHub repository already created (rcobean-sei/GanttGen)
- Git configured and able to push to GitHub
- All test files committed to your repository

## Step-by-Step Instructions

### Step 1: Commit the GitHub Actions Workflow

The workflow file (`.github/workflows/test.yml`) needs to be committed and pushed:

```bash
# Add the workflow file
git add .github/workflows/test.yml

# Commit it
git commit -m "Add GitHub Actions workflow for automated testing"

# Push to your repository
git push origin color-updates
```

**Note**: If you want badges on your main branch, merge this branch to main/master first.

### Step 2: Verify Workflow File is in Default Branch

The badges will only work when the workflow file exists in your default branch (usually `main` or `master`):

```bash
# Check your current branch
git branch --show-current

# If you're on a feature branch, merge to main:
git checkout main  # or master
git merge color-updates
git push origin main
```

### Step 3: Trigger the Workflow

The workflow runs automatically on:
- Push to main/master/develop branches
- Pull requests to those branches

**To trigger manually:**
1. Go to your GitHub repository
2. Click on the "Actions" tab
3. Select "Tests" workflow
4. Click "Run workflow" button (if available)
5. Or make a small commit and push to trigger it

### Step 4: Wait for First Workflow Run

After pushing, GitHub Actions will:
1. Run the workflow (takes ~2-5 minutes)
2. Execute all tests
3. Update the badge status

**Check status:**
- Go to: `https://github.com/rcobean-sei/GanttGen/actions`
- You should see a workflow run in progress or completed

### Step 5: Verify Badge is Working

Once the workflow completes:

1. **Check the badge in README:**
   - Go to your repository on GitHub
   - View the README.md
   - The "Tests" badge should show:
     - ✅ Green "passing" if tests pass
     - ❌ Red "failing" if tests fail
     - 🟡 Yellow "running" while in progress

2. **Badge URL:**
   ```
   https://github.com/rcobean-sei/GanttGen/actions/workflows/test.yml/badge.svg
   ```

### Step 6: (Optional) Set Up Codecov for Coverage Badge

The coverage badge requires Codecov integration:

1. **Sign up for Codecov:**
   - Go to [codecov.io](https://codecov.io)
   - Sign in with your GitHub account
   - Authorize Codecov to access your repositories

2. **Add your repository:**
   - Click "Add a repository"
   - Select `rcobean-sei/GanttGen`
   - Codecov will automatically detect the workflow

3. **Get your Codecov token** (if needed):
   - Go to repository settings in Codecov
   - Copy the upload token
   - Add it as a GitHub secret (usually not needed for public repos)

4. **Verify coverage badge:**
   - After the first workflow run with coverage upload
   - The badge should show coverage percentage
   - Badge URL: `https://codecov.io/gh/rcobean-sei/GanttGen/branch/main/graph/badge.svg`

## Troubleshooting

### Badge Shows "no status"
- **Cause**: Workflow hasn't run yet or file isn't in default branch
- **Fix**: Ensure workflow file is in main/master branch and trigger a run

### Badge Shows "failing"
- **Cause**: Tests are actually failing
- **Fix**: 
  ```bash
  # Run tests locally to see errors
  npm test
  
  # Fix failing tests, then commit and push
  git add .
  git commit -m "Fix failing tests"
  git push
  ```

### Coverage Badge Not Appearing
- **Cause**: Codecov not set up or workflow not uploading coverage
- **Fix**: 
  1. Sign up at codecov.io
  2. Add repository
  3. Wait for next workflow run
  4. Check workflow logs for Codecov upload step

### Workflow Not Running
- **Cause**: File not in correct location or branch
- **Fix**: 
  ```bash
  # Verify file exists
  ls -la .github/workflows/test.yml
  
  # Ensure it's committed
  git status
  
  # Push to default branch
  git push origin main
  ```

## Quick Checklist

- [ ] Workflow file (`.github/workflows/test.yml`) is committed
- [ ] Workflow file is in your default branch (main/master)
- [ ] Workflow has run at least once (check Actions tab)
- [ ] Tests badge appears in README (may show "no status" initially)
- [ ] (Optional) Codecov account created and repository added
- [ ] (Optional) Coverage badge appears after first successful run

## Current Status

After completing these steps, your badges will:
- ✅ Update automatically on every push/PR
- ✅ Show real-time test status
- ✅ Link to workflow runs when clicked
- ✅ Display coverage percentage (if Codecov is set up)

## Next Steps

Once badges are working:
1. Merge your feature branch to main
2. Badges will continue updating on every commit
3. Consider adding more badges (build status, dependencies, etc.)



