# MVA Unified Tool Final Handoff and Testing Guide

> Release note, 14 July 2026: use `docs/FINAL_PRODUCTION_HANDOVER.md` as the definitive release handover. This file is retained for historical test/deployment detail.

This file is a handoff note for an earlier MVA Unified Tool build.

## Live Links

Public GitHub repository:

```text
https://github.com/DrHayabusa/unified-tool
```

Live team UI:

```text
https://drhayabusa.github.io/unified-tool/
```

Sample data guide:

```text
https://github.com/DrHayabusa/unified-tool/blob/main/SAMPLE_DATA.md
```

Detailed rebuild guide:

```text
https://github.com/DrHayabusa/unified-tool/blob/main/docs/BUILD_REPLICATION_GUIDE.md
```

API key handling guide:

```text
https://github.com/DrHayabusa/unified-tool/blob/main/docs/API_KEYS.md
```

## What Was Built

The tool is a high-end cybersecurity themed MVA dashboard for scanner intake, vulnerability prioritization, monthly comparison, Excel dashboard output, and AI Remediation Guide PDF planning.

Current implemented sources:

```text
Tenable.sc
Tenable.io
Qualys
```

Designed future sources:

```text
MDVM
CrowdStrike
Custom CSV
```

Current workflows:

```text
Dashboard landing/config page
Adhoc scan workflow
Monthly comparison workflow
AI remediation PDF panel
Local API connectivity test
Sample data and reference output package
GitHub Pages deployment
```

## UI Cleanup Completed

The original sidebar showed pages such as Upload, History, AI Agent, and Reports even though those were not separate accessible pages.

That has now been fixed.

The sidebar now only shows real working destinations:

```text
Dashboard
Adhoc Scan
Monthly Compare
```

Upload, reports, and AI generation remain available inside the actual workflows where they belong:

```text
Adhoc Scan -> upload -> dashboard -> AI PDF panel
Monthly Compare -> upload monthly exports -> dashboard -> Excel + AI PDF panel
```

## AI PDF Availability

AI PDF generation is now visible in the monthly workflow too.

Monthly comparison now includes:

```text
Generated report output card
Excel report action
AI Remediation Guide PDF provider selector
Target month selector
Generate AI PDF Report button
```

## API Key Status

No real API key was committed to GitHub.

The public React/GitHub Pages app must never contain a real NVIDIA, Groq, OpenRouter, OpenAI, or internal AI server key.

For local/private backend use, put keys here:

```text
/Users/mohammedshahid/Documents/New project/unified-tool/.env
```

Create it with:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
cp .env.example .env
nano .env
```

Example:

```text
NVIDIA_API_KEY=your_real_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3-ultra-550b-a55b
```

The `.gitignore` file ignores real `.env` files.

NVIDIA connectivity can be tested locally with:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
python3 tools/test_nvidia_connectivity.py
```

The deployed UI also has a **Test API Connectivity** button in the AI PDF panel. That button is for testing your backend health endpoint. It does not expose or send provider API keys from the browser.

To make the button work from your Mac, start the local API server first:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
./run-local-api.sh
```

Then use this health URL in the UI:

```text
http://127.0.0.1:8000/health/nvidia
```

Expected result:

```text
API status: Connected: 200
```

The PDF generation button currently sends a placeholder backend request to:

```text
http://127.0.0.1:8000/generate/pdf
```

That endpoint confirms the UI/backend handoff works. The next production step is wiring this endpoint to the actual PDF builder and AI prompt pipeline.

The UI also has session-only credential fields:

```text
API Key (session only)
Provider Base URL
Model
```

For NVIDIA testing:

```text
Provider Base URL: https://integrate.api.nvidia.com/v1
Model: nvidia/nemotron-3-ultra-550b-a55b
```

Session-pasted keys are not saved or committed. Refreshing the page clears them. For production, keep keys on the backend.

## Sample Data for Testing

Use these files to test the app and backend logic.

### Tenable.sc Monthly Comparison

Upload these four files together:

```text
samples/tenable_100_row/tenable_sc_april_2026_100plus.csv
samples/tenable_100_row/tenable_sc_may_2026_100plus.csv
samples/tenable_100_row/tenable_sc_june_2026_100plus.csv
samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
```

Direct GitHub links:

```text
https://github.com/DrHayabusa/unified-tool/blob/main/samples/tenable_100_row/tenable_sc_april_2026_100plus.csv
https://github.com/DrHayabusa/unified-tool/blob/main/samples/tenable_100_row/tenable_sc_may_2026_100plus.csv
https://github.com/DrHayabusa/unified-tool/blob/main/samples/tenable_100_row/tenable_sc_june_2026_100plus.csv
https://github.com/DrHayabusa/unified-tool/blob/main/samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
```

### Tenable.io Monthly Comparison

Upload these four files together:

```text
samples/tenable_100_row/tenable_io_april_2026_100plus.csv
samples/tenable_100_row/tenable_io_may_2026_100plus.csv
samples/tenable_100_row/tenable_io_june_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
```

Direct GitHub links:

```text
https://github.com/DrHayabusa/unified-tool/blob/main/samples/tenable_100_row/tenable_io_april_2026_100plus.csv
https://github.com/DrHayabusa/unified-tool/blob/main/samples/tenable_100_row/tenable_io_may_2026_100plus.csv
https://github.com/DrHayabusa/unified-tool/blob/main/samples/tenable_100_row/tenable_io_june_2026_100plus.csv
https://github.com/DrHayabusa/unified-tool/blob/main/samples/tenable_100_row/tenable_io_july_2026_100plus.csv
```

### Mixed Tenable SC to IO Migration Comparison

Upload this mixed set:

```text
samples/tenable_100_row/tenable_sc_april_2026_100plus.csv
samples/tenable_100_row/tenable_sc_may_2026_100plus.csv
samples/tenable_100_row/tenable_io_june_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
```

### Qualys Monthly Comparison

Upload these four files together:

```text
samples/qualys_100_row/qualys_monthly_april_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_may_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_june_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_july_2026_100plus.csv
```

Direct GitHub links:

```text
https://github.com/DrHayabusa/unified-tool/blob/main/samples/qualys_100_row/qualys_monthly_april_2026_100plus.csv
https://github.com/DrHayabusa/unified-tool/blob/main/samples/qualys_100_row/qualys_monthly_may_2026_100plus.csv
https://github.com/DrHayabusa/unified-tool/blob/main/samples/qualys_100_row/qualys_monthly_june_2026_100plus.csv
https://github.com/DrHayabusa/unified-tool/blob/main/samples/qualys_100_row/qualys_monthly_july_2026_100plus.csv
```

### Adhoc Testing

Use any one of these:

```text
samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
samples/qualys_100_row/qualys_adhoc_july_2026_100plus.csv
```

Direct GitHub links:

```text
https://github.com/DrHayabusa/unified-tool/blob/main/samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
https://github.com/DrHayabusa/unified-tool/blob/main/samples/tenable_100_row/tenable_io_july_2026_100plus.csv
https://github.com/DrHayabusa/unified-tool/blob/main/samples/qualys_100_row/qualys_adhoc_july_2026_100plus.csv
```

## Expected Sample Metrics

The 100+ row samples are designed to validate all dashboard scenarios.

Expected final current-month profile:

```text
Total open: 125
New this month: 30
Not closed from previous months: 95
Remediated last month: 25
Patch priority split: P1 41, P2 31, P3 26, P4 27
```

Adhoc expected profile:

```text
Total vulnerabilities: 125
Critical: 31
High: 31
Medium: 31
Low: 32
P1: 41
P2: 31
P3: 26
P4: 27
```

## Reference Outputs

Excel workbooks:

```text
output/excel/tenable_sc_multimonth_dashboard_sample.xlsx
output/excel/tenable_io_multimonth_dashboard_sample.xlsx
output/excel/tenable_mixed_sc_io_dashboard_sample.xlsx
output/excel/qualys_100plus_dashboard_sample.xlsx
```

PDF:

```text
output/pdf/mva_100plus_remediation_guide.pdf
```

## Validation Commands

Run from local repo:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
```

React:

```bash
cd react-ui
npm ci
npm run build
```

Python:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
python3 -m compileall mva_engine tools
```

Secret scan:

```bash
rg -n "nvapi-|NVIDIA_API_KEY|OPENAI_API_KEY|GROQ_API_KEY|OPENROUTER_API_KEY|sk-[A-Za-z0-9]|api_key\\s*=|API Key|api key" . \
  -g '!react-ui/node_modules/**' \
  -g '!react-ui/dist/**'
```

Monthly SC:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --approach same-source \
  --snapshot "April 2026=samples/tenable_100_row/tenable_sc_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_sc_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_sc_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_sc_july_2026_100plus.csv"
```

Monthly IO:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --approach same-source \
  --snapshot "April 2026=samples/tenable_100_row/tenable_io_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_io_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_io_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_io_july_2026_100plus.csv"
```

Qualys:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --snapshot "April 2026=samples/qualys_100_row/qualys_monthly_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/qualys_100_row/qualys_monthly_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/qualys_100_row/qualys_monthly_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/qualys_100_row/qualys_monthly_july_2026_100plus.csv"
```

## Current Production Limitation

The GitHub Pages app is static.

It can show and validate the UI/UX, workflow structure, and sample dashboard design, but it cannot safely run private API keys or server-side file processing from GitHub Pages alone.

For full production:

```text
React UI -> internal backend/API server -> local processing + AI provider -> XLSX/PDF download
```

The backend should store API keys as environment variables.

## Final State

The repo was created, pushed, made public, and deployed to GitHub Pages.

Final team link:

```text
https://drhayabusa.github.io/unified-tool/
```
