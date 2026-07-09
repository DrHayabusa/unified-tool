# MVA Unified Agent

MVA Unified Agent is the next-generation vulnerability reporting platform for normalizing scanner exports, building customer-ready CSV/Excel outputs, and generating remediation PDFs.

Current first milestone:

- Tenable.sc and Tenable.io field mapping
- Tenable.sc-only, Tenable.io-only, and mixed SC/IO multi-month comparison
- MVA priority matrix based on severity and exploit availability
- Date-aware PDF summary concept
- Customer-ready PDF samples with headers, footers, KB links, and AI report instructions

Planned source tools:

- Tenable.sc
- Tenable.io
- Microsoft Defender Vulnerability Management
- CrowdStrike
- Qualys
- Custom CSV

## PDF Samples

Generated PDFs are stored in:

```text
output/pdf/
```

Preview PNGs are stored in:

```text
output/previews/
```

Regenerate the sample PDFs:

```bash
/Users/mohammedshahid/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/generate_sample_pdfs.py
```

## Final App Behavior

1. Analyst selects the source tool.
2. Analyst uploads one or more CSV/XLSX exports.
3. MVA asks which reporting date/month should be summarized.
4. MVA normalizes raw source fields into the MVA report schema.
5. MVA calculates exploit availability, patch priority, asset exposure, and aging.
6. MVA generates CSV, Excel, and PDF outputs.
7. Optional AI provider writes the report narrative from normalized rows only.

## React UI Prototype

The high-end React/Tailwind dashboard lives in:

```text
react-ui/
```

Run it locally:

```bash
cd "/Users/mohammedshahid/Documents/New project/MVA-Unified-Agent"
./run-react-ui.sh
```

Open:

```text
http://127.0.0.1:8800/
```

Implemented UI states:

- Landing/config page with source tool selection and operation mode selection.
- Adhoc Scan workflow with upload state and metric cards using Recharts sparklines.
- Monthly Data Comparison workflow with same-source multi-month and mixed SC/IO migration upload approaches, generated Excel layout, and AI PDF generation panel.

## GitHub Pages Deployment

This repository includes a GitHub Actions workflow at:

```text
.github/workflows/deploy-pages.yml
```

After the repository is pushed to GitHub as `DrHayabusa/unified-tool`, enable GitHub Pages with **Source: GitHub Actions**. The workflow builds `react-ui/` and publishes the static dashboard to:

```text
https://drhayabusa.github.io/unified-tool/
```

Production build test:

```bash
cd react-ui
npm ci
npm run build
```

Sample upload files and reference Excel/PDF outputs are listed in:

```text
SAMPLE_DATA.md
```

## Complete Recreate Handover

The granular build notes, architecture, field mappings, dashboard formulas, AI provider flow, cloud deployment notes, validation checklist, and rebuild prompt are documented here:

```text
docs/COMPLETE_RECREATE_HANDOVER.md
```

For cloud-only testing, deploy an API backend and paste that backend health endpoint into the UI, for example:

```text
https://your-mva-api.example.com/health/nvidia
```

Do not use `127.0.0.1` from GitHub Pages unless you are intentionally testing a backend running on your own laptop.

## MVA Report Schema

The first production version will prioritize these fields:

```text
IP Address
DNS Name
Vulnerability Name
CVE
Severity
Exploit Availability
Patch Priority
Asset Exposure
Vulnerability Finding
Summary
Description
Remediation
KB Links
Platform Details
First Discovered
Last Observed
```
