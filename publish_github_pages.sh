#!/usr/bin/env bash
set -euo pipefail

OWNER="${GITHUB_OWNER:-DrHayabusa}"
REPO="${GITHUB_REPO:-unified-tool}"
REMOTE_URL="https://github.com/${OWNER}/${REPO}.git"
OWNER_LOWER="$(printf '%s' "${OWNER}" | tr '[:upper:]' '[:lower:]')"
PAGES_URL="https://${OWNER_LOWER}.github.io/${REPO}/"

echo "MVA Unified Tool publisher"
echo "Owner: ${OWNER}"
echo "Repo:  ${REPO}"
echo

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is not installed."
  echo "Install it first:"
  echo "  brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is installed but not authenticated."
  echo "Run this once, then rerun this script:"
  echo "  gh auth login --hostname github.com --git-protocol https --web"
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree has uncommitted changes. Commit them before publishing."
  git status --short
  exit 1
fi

if gh repo view "${OWNER}/${REPO}" >/dev/null 2>&1; then
  echo "Repository already exists: ${REMOTE_URL}"
else
  echo "Creating public repository: ${OWNER}/${REPO}"
  gh repo create "${OWNER}/${REPO}" --public --description "MVA Unified vulnerability intake and remediation cockpit"
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "${REMOTE_URL}"
else
  git remote add origin "${REMOTE_URL}"
fi

echo "Pushing main branch..."
git push -u origin main

echo "Enabling GitHub Pages with GitHub Actions source..."
if gh api --method POST "repos/${OWNER}/${REPO}/pages" -f build_type=workflow >/dev/null 2>&1; then
  echo "GitHub Pages enabled."
else
  echo "Pages may already be enabled, or GitHub needs it enabled manually."
  echo "If deployment does not start, open:"
  echo "  https://github.com/${OWNER}/${REPO}/settings/pages"
  echo "Set Source to: GitHub Actions"
fi

echo "Triggering Pages workflow..."
gh workflow run "Deploy React UI to GitHub Pages" --repo "${OWNER}/${REPO}" || true

echo
echo "Public repo:"
echo "  ${REMOTE_URL}"
echo "Team UI link after the Pages workflow finishes:"
echo "  ${PAGES_URL}"
echo
echo "Check workflow status:"
echo "  gh run list --repo ${OWNER}/${REPO} --workflow \"Deploy React UI to GitHub Pages\" --limit 3"
