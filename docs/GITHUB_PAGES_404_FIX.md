# GitHub Pages 404 Fix

This document explains why the team link can show 404 and how to fix it.

## Current Symptom

Expected team URL:

```text
https://drhayabusa.github.io/unified-tool/
```

If this returns GitHub Pages `Site not found`, the React app is not the problem. The URL depends on a GitHub repository and a successful Pages deployment.

## Root Cause Checklist

1. Repository does not exist:

```bash
curl -I https://api.github.com/repos/DrHayabusa/unified-tool
```

If this returns `404`, GitHub has no public repository named `DrHayabusa/unified-tool`.

2. Repository exists, but code was not pushed:

```bash
git ls-remote https://github.com/DrHayabusa/unified-tool.git
```

If this fails or returns no refs, the local repo has not been pushed.

3. GitHub Pages is not enabled:

Open:

```text
https://github.com/DrHayabusa/unified-tool/settings/pages
```

Set **Source** to **GitHub Actions**.

4. Pages workflow did not finish:

Open:

```text
https://github.com/DrHayabusa/unified-tool/actions
```

The workflow named **Deploy React UI to GitHub Pages** must complete successfully.

## One-Command Publish Path

From the local repo folder:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
chmod +x publish_github_pages.sh
./publish_github_pages.sh
```

If the script says GitHub CLI is missing:

```bash
brew install gh
```

If the script says GitHub CLI is not authenticated:

```bash
gh auth login --hostname github.com --git-protocol https --web
```

Then rerun:

```bash
./publish_github_pages.sh
```

## Why Authentication Is Required

Creating a public GitHub repository, pushing commits, and enabling GitHub Pages are account-level actions. They cannot be completed from an unauthenticated terminal.

The local project is already committed and ready. The 404 is fixed only after:

```text
repo exists -> main branch is pushed -> Pages workflow deploys
```

## Expected Final Links

Repository:

```text
https://github.com/DrHayabusa/unified-tool
```

Team UI:

```text
https://drhayabusa.github.io/unified-tool/
```
