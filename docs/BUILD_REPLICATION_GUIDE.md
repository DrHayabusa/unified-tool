# MVA Unified Tool Build and Replication Guide

This guide explains how the MVA Unified Tool was built, how the current files work together, how to regenerate the samples and reports, how to validate the output, and how to publish the same tool again with Codex, Claude Code, or a development team.

## 1. Final Deliverables

The delivered project is a public GitHub Pages-ready repository named:

```text
DrHayabusa/unified-tool
```

The team-facing static UI is deployed from:

```text
react-ui/
```

The local project folder is:

```text
/Users/mohammedshahid/Documents/New project/unified-tool
```

The main production URLs are:

```text
https://github.com/DrHayabusa/unified-tool
https://drhayabusa.github.io/unified-tool/
```

## 2. What This Version Does

This version focuses on the first production milestone:

```text
Tenable.sc monthly comparison
Tenable.io monthly comparison
Mixed Tenable.sc to Tenable.io migration comparison
Qualys monthly comparison
Tenable.sc adhoc dashboard
Tenable.io adhoc dashboard
Qualys adhoc dashboard
Excel dashboard workbook generation
Industry-style remediation PDF sample generation
High-end React/Tailwind cybersecurity UI
GitHub Pages static deployment
```

The dashboard scope was intentionally kept tight to avoid useless widgets.

Monthly comparison dashboards include only:

```text
Trend of vulnerabilities discovered in the last 3 months
Total open vulnerabilities
Total open vulnerabilities by patch priority
Total open vulnerabilities by age and patch priority
Total vulnerabilities patched in the last month
```

Adhoc dashboards include:

```text
Total vulnerabilities
Severity counts
Patch priority counts
Top 10 affected assets
```

## 3. Folder Structure

```text
.
├── .github/workflows/deploy-pages.yml
├── README.md
├── SAMPLE_DATA.md
├── docs/
│   ├── AI_PDF_GENERATION_PROMPT.md
│   ├── BUILD_REPLICATION_GUIDE.md
│   ├── GITHUB_PAGES_404_FIX.md
│   ├── TENABLE_FIELD_VALIDATION_AND_DASHBOARDS.md
│   └── TENABLE_SC_IO_MAPPING.md
├── mva_engine/
│   ├── __init__.py
│   ├── tenable_dashboards.py
│   └── tenable_normalizer.py
├── output/
│   ├── dashboard_json/
│   ├── excel/
│   └── pdf/
├── react-ui/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── src/
├── samples/
│   ├── qualys_100_row/
│   ├── tenable/
│   └── tenable_100_row/
├── tools/
│   ├── build_tenable_dashboard_workbook.mjs
│   ├── generate_100plus_remediation_pdf.py
│   ├── generate_qualys_100_row_samples.py
│   ├── generate_sample_pdfs.py
│   ├── generate_tenable_100_row_samples.py
│   └── tenable_dashboard_cli.py
├── publish_github_pages.sh
├── run-react-ui.sh
└── run-ui.sh
```

## 4. Core Design Decisions

The project uses a split architecture:

```text
Python engine for scanner normalization and dashboard math
Node script for Excel workbook generation
React/Tailwind/Vite for the high-end UI
GitHub Actions for static deployment
GitHub Pages for public team access
```

This was chosen because:

```text
React gives full custom UI/UX control.
Tailwind makes the dark cybersecurity theme fast to tune.
Python is strong for CSV parsing, normalization, and metric calculation.
Node is used for Excel workbook generation because the workbook builder is already implemented there.
GitHub Pages is free and good for a static demo/team preview.
No database is required for this version.
```

Important limitation:

```text
GitHub Pages hosts only the static React UI.
It does not run the Python backend.
Team members can test the UI and download/view samples from the repo.
Local CLI/report generation still runs on a machine with Python/Node.
```

For a full production platform where uploads generate real files in-browser for all users, deploy the backend separately on an internal server or convert the processing pipeline to an API service.

## 5. Priority Matrix

Patch priority is calculated from severity plus exploit availability.

Exploit availability comes from:

```text
Tenable.sc: Exploit?
Tenable.sc secondary signal: Exploit Ease
Tenable.io: definition.exploitability_ease
Tenable.io secondary signals: definition.exploited_by_malware, definition.exploited_by_nessus, exploit maturity fields
Qualys: Exploitability, Associated Malware
```

Matrix:

```text
Exploit available + Critical = P1
Exploit available + High     = P1
Exploit available + Medium   = P2
Exploit available + Low      = P2

No exploit + Critical = P2
No exploit + High     = P2
No exploit + Medium   = P3
No exploit + Low      = P4
```

Official vulnerability color language used in the UI/workbooks:

```text
Critical = red
High     = orange
Medium   = amber/yellow
Low      = green
P1       = red/immediate
P2       = orange/priority
P3       = amber/planned
P4       = green/deferred
```

## 6. Normalized Report Fields

The target normalized fields are:

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

The normalizer also keeps internal fields needed for comparison:

```text
source
asset_key
finding_key
age_days
port
protocol
plugin_id_or_qid
status
last_fixed
```

## 7. Scanner Field Mapping

### Tenable.sc

Important source fields:

```text
IP Address
DNS Name
Plugin Name
CVE
Severity
Risk Factor
Exploit?
Exploit Ease
Plugin Output
Synopsis
Description
Steps to Remediate
See Also
First Discovered
Last Observed
Port
Protocol
Plugin
Family
```

Mapping examples:

```text
IP Address -> normalized IP Address
DNS Name -> normalized DNS Name
Plugin Name -> normalized Vulnerability Name
CVE -> normalized CVE
Severity or Risk Factor -> normalized Severity
Exploit? / Exploit Ease -> normalized Exploit Availability
Steps to Remediate -> normalized Remediation
See Also / Cross References -> normalized KB Links
First Discovered -> normalized First Discovered
Last Observed -> normalized Last Observed
```

### Tenable.io

Important source fields:

```text
asset.display_ipv4_address
asset.host_name
asset.display_fqdn
definition.name
definition.cve
severity
definition.severity
definition.exploitability_ease
definition.description
definition.synopsis
definition.solution
definition.see_also
first_observed
last_seen
vuln_age
age_in_days
port
protocol
definition.id
```

Mapping examples:

```text
asset.display_ipv4_address -> normalized IP Address
asset.display_fqdn / asset.host_name -> normalized DNS Name
definition.name -> normalized Vulnerability Name
definition.cve -> normalized CVE
severity / definition.severity -> normalized Severity
definition.exploitability_ease -> normalized Exploit Availability
definition.solution -> normalized Remediation
definition.see_also -> normalized KB Links
first_observed -> normalized First Discovered
last_seen -> normalized Last Observed
vuln_age / age_in_days -> normalized age_days
```

### Qualys Monthly

Important source fields:

```text
IP
DNS
NetBIOS
QID
Title
Vuln Status
Severity
Port
Protocol
First Detected
Last Detected
Date Last Fixed
CVE ID
Threat
Impact
Solution
Exploitability
Associated Malware
Results
Category
```

Mapping examples:

```text
IP -> normalized IP Address
DNS / FQDN / NetBIOS -> normalized DNS Name
Title -> normalized Vulnerability Name
CVE ID -> normalized CVE
Severity -> normalized Severity
Exploitability / Associated Malware -> normalized Exploit Availability
Threat -> normalized Summary
Impact -> normalized Description
Solution -> normalized Remediation
Results -> normalized Vulnerability Finding
First Detected -> normalized First Discovered
Last Detected -> normalized Last Observed
Date Last Fixed -> remediation evidence
Vuln Status -> open/fixed filtering
```

### Qualys Adhoc

Adhoc fields are similar to monthly but do not include monthly lifecycle columns like `Vuln Status`, `Date Last Fixed`, or reopen history. The same normalizer supports both.

## 8. Monthly Comparison Logic

Monthly comparison accepts two or more snapshots.

Each snapshot is passed as:

```text
"Month YYYY=/path/to/file.csv"
```

The normalized comparison key is based on stable vulnerability identity:

```text
asset identity + vulnerability/plugin/QID/CVE/title + port + protocol
```

This lets SC and IO be compared even when column names differ.

Monthly metrics:

```text
current_open = count of findings in the current month
previous_open = count of findings in the previous month
new_this_month = current findings not present in previous month
not_closed_from_previous_months = current findings also present in previous month
patched_last_month = previous_open + new_this_month - current_open
```

The code also calculates `patched_count_by_key_diff` using key-level set difference as a sanity check.

Age buckets:

```text
>7 days
>30 days
>60 days
>180 days (6+ months)
```

The age-by-priority table is:

```text
P1 x age buckets
P2 x age buckets
P3 x age buckets
P4 x age buckets
```

## 9. Adhoc Logic

Adhoc accepts one scanner CSV and returns:

```text
total_vulnerabilities
severity_counts
patch_priority_counts
top_10_affected_assets
```

It does not calculate monthly movement because only one snapshot exists.

## 10. Python Engine

Main files:

```text
mva_engine/tenable_normalizer.py
mva_engine/tenable_dashboards.py
tools/tenable_dashboard_cli.py
```

Responsibilities:

```text
tenable_normalizer.py:
  Detects source type.
  Maps raw scanner columns into normalized rows.
  Calculates severity, exploit availability, priority, age, and stable keys.

tenable_dashboards.py:
  Builds monthly comparison data.
  Builds adhoc dashboard data.
  Calculates trends, age buckets, priority distribution, and patched counts.

tenable_dashboard_cli.py:
  Provides command-line access for validation and JSON generation.
```

CLI subcommands:

```bash
python3 tools/tenable_dashboard_cli.py adhoc <csv> --output output.json
python3 tools/tenable_dashboard_cli.py monthly --snapshot "July 2026=file.csv" --snapshot "August 2026=file.csv" --output output.json
```

Monthly approaches:

```text
auto            = accepts any supported normalized source
same-source     = requires all files from the same scanner/export family
mixed-tenable   = allows Tenable.sc and Tenable.io together
```

## 11. Excel Workbook Generation

Main file:

```text
tools/build_tenable_dashboard_workbook.mjs
```

Output folder:

```text
output/excel/
```

The workbook includes:

```text
Executive dashboard
Monthly trend line charts
Vulnerabilities discovered line chart
Vulnerabilities remediated line chart
Patch priority distribution
Age-by-priority matrix
Open vulnerability summary
```

Design decisions:

```text
Avoid black-heavy UI in Excel.
Use clean, executive-friendly colors.
Keep charts compact.
Avoid overlapping chart anchors.
Use consistent SC/IO/Qualys color coding.
Use "Report" language instead of "Snapshot".
Remove unclear status labels like baseline/added/open.
```

## 12. PDF Generation

Main files:

```text
tools/generate_100plus_remediation_pdf.py
tools/generate_kb_remediation_pdf.py
tools/generate_pdf_format_options.py
tools/generate_sample_pdfs.py
docs/AI_PDF_GENERATION_PROMPT.md
```

Output folder:

```text
output/pdf/
```

Final preferred PDF style:

```text
Report title: Remediation Guide
No customer name
No "prepared from KB" wording
No unnecessary "created by" or "purpose" sections
Tool Source must match the selected agent source
Clean table of contents
Vulnerability name sections
Remediation steps from KB/reference links where available
Command blocks formatted like Notion/Obsidian code blocks
Professional header and footer
Industry-level customer-facing language
```

AI server expectation:

```text
CSV comparison happens locally.
Normalized findings and selected month are sent to the AI server.
AI server returns report narrative and remediation instructions.
PDF builder formats the final report consistently.
```

## 13. React UI

Main folder:

```text
react-ui/
```

Important files:

```text
react-ui/src/App.jsx
react-ui/src/index.css
react-ui/src/components/Sidebar.jsx
react-ui/src/components/HeroHeader.jsx
react-ui/src/components/SourceChoice.jsx
react-ui/src/components/OperationMode.jsx
react-ui/src/components/UploadPanel.jsx
react-ui/src/components/MetricsRow.jsx
react-ui/src/components/MonthlyComparison.jsx
react-ui/src/components/PriorityMatrix.jsx
react-ui/src/components/AiReportBuilder.jsx
react-ui/src/components/FieldMappingPanel.jsx
react-ui/src/components/RemediationQueue.jsx
react-ui/src/components/ToolIcons.jsx
react-ui/src/data/dashboardData.js
```

UI technology:

```text
React 18
Vite
Tailwind CSS
Recharts
Lucide React
```

UI theme:

```text
Dark cybersecurity cockpit
Slate-950 base
Neon green/cyan/amber accents
Subtle card borders
Radar/bug/vulnerability motif
Tool selection tiles
Adhoc and monthly workflow states
AI provider panel
Priority matrix panel
Micro sparklines and line charts
```

Installed dependencies:

```json
{
  "lucide-react": "^0.468.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "recharts": "^2.15.0"
}
```

Local run command:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
./run-react-ui.sh
```

Manual run command:

```bash
cd react-ui
npm ci
npm run dev
```

Open:

```text
http://127.0.0.1:8800/
```

## 14. GitHub Pages Deployment

Deployment workflow:

```text
.github/workflows/deploy-pages.yml
```

The workflow:

```text
Checks out repo
Installs Node 20
Runs npm ci in react-ui
Runs npm run build in react-ui
Sets GITHUB_PAGES_BASE=/unified-tool/
Uploads react-ui/dist as a Pages artifact
Deploys the artifact to GitHub Pages
```

The Vite config supports both local and GitHub Pages paths:

```js
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES_BASE || "/",
});
```

Without this base path, GitHub Pages can load `index.html` but fail to load JS/CSS assets from the right subpath.

## 15. Publish Script

Main file:

```text
publish_github_pages.sh
```

What it does:

```text
Checks that gh is installed.
Checks that gh is authenticated.
Checks the git worktree is clean.
Creates DrHayabusa/unified-tool if missing.
Sets origin to https://github.com/DrHayabusa/unified-tool.git.
Pushes main.
Enables GitHub Pages with workflow build type.
Triggers Deploy React UI to GitHub Pages workflow.
Prints repo URL and Pages URL.
```

Run:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
./publish_github_pages.sh
```

If `gh` is missing:

```bash
brew install gh
```

If auth is missing:

```bash
gh auth login --hostname github.com --git-protocol https --web
```

## 16. Sample Data

Sample guide:

```text
SAMPLE_DATA.md
```

Tenable.sc monthly samples:

```text
samples/tenable_100_row/tenable_sc_april_2026_100plus.csv
samples/tenable_100_row/tenable_sc_may_2026_100plus.csv
samples/tenable_100_row/tenable_sc_june_2026_100plus.csv
samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
```

Tenable.io monthly samples:

```text
samples/tenable_100_row/tenable_io_april_2026_100plus.csv
samples/tenable_100_row/tenable_io_may_2026_100plus.csv
samples/tenable_100_row/tenable_io_june_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
```

Mixed Tenable migration samples:

```text
samples/tenable_100_row/tenable_sc_april_2026_100plus.csv
samples/tenable_100_row/tenable_sc_may_2026_100plus.csv
samples/tenable_100_row/tenable_io_june_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
```

Qualys monthly samples:

```text
samples/qualys_100_row/qualys_monthly_april_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_may_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_june_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_july_2026_100plus.csv
```

Adhoc samples:

```text
samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
samples/qualys_100_row/qualys_adhoc_july_2026_100plus.csv
```

Expected final-month sample metrics:

```text
Total open: 125
New this month: 30
Not closed from previous months: 95
Remediated last month: 25
Patch priority split: P1 41, P2 31, P3 26, P4 27
```

## 17. Validation Commands

Run from repo root.

React build:

```bash
cd react-ui
npm ci
npm run build
```

Python compile:

```bash
python3 -m compileall mva_engine tools
```

Secret scan:

```bash
rg -n "nvapi-|NVIDIA_API_KEY|OPENAI_API_KEY|GROQ_API_KEY|OPENROUTER_API_KEY|sk-[A-Za-z0-9]|api_key\\s*=|API Key|api key" . \
  -g '!react-ui/node_modules/**' \
  -g '!react-ui/dist/**'
```

Tenable.sc monthly:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --approach same-source \
  --snapshot "April 2026=samples/tenable_100_row/tenable_sc_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_sc_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_sc_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_sc_july_2026_100plus.csv" \
  --output output/dashboard_json/validate_sc_monthly.json
```

Tenable.io monthly:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --approach same-source \
  --snapshot "April 2026=samples/tenable_100_row/tenable_io_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_io_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_io_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_io_july_2026_100plus.csv" \
  --output output/dashboard_json/validate_io_monthly.json
```

Mixed Tenable:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --approach mixed-tenable \
  --snapshot "April 2026=samples/tenable_100_row/tenable_sc_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_sc_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_io_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_io_july_2026_100plus.csv" \
  --output output/dashboard_json/validate_mixed_monthly.json
```

Qualys monthly:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --snapshot "April 2026=samples/qualys_100_row/qualys_monthly_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/qualys_100_row/qualys_monthly_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/qualys_100_row/qualys_monthly_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/qualys_100_row/qualys_monthly_july_2026_100plus.csv" \
  --output output/dashboard_json/validate_qualys_monthly.json
```

Adhoc:

```bash
python3 tools/tenable_dashboard_cli.py adhoc samples/tenable_100_row/tenable_sc_july_2026_100plus.csv --output output/dashboard_json/validate_adhoc_sc.json
python3 tools/tenable_dashboard_cli.py adhoc samples/tenable_100_row/tenable_io_july_2026_100plus.csv --output output/dashboard_json/validate_adhoc_io.json
python3 tools/tenable_dashboard_cli.py adhoc samples/qualys_100_row/qualys_adhoc_july_2026_100plus.csv --output output/dashboard_json/validate_adhoc_qualys.json
```

Workbook/PDF integrity:

```bash
python3 - <<'PY'
from pathlib import Path
from zipfile import ZipFile

for p in sorted(Path("output/excel").glob("*.xlsx")):
    with ZipFile(p) as z:
        bad = z.testzip()
        names = set(z.namelist())
        print("XLSX", p, "bad=", bad, "valid=", {"[Content_Types].xml", "xl/workbook.xml"} <= names)

for p in sorted(Path("output/pdf").glob("*.pdf")):
    print("PDF", p, "header=", p.read_bytes()[:5])
PY
```

Pages verification:

```bash
curl -L -I https://drhayabusa.github.io/unified-tool/
```

Expected:

```text
HTTP/2 200
```

## 18. How to Rebuild From Scratch

1. Create the project folder:

```bash
mkdir -p "/Users/mohammedshahid/Documents/New project/unified-tool"
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
```

2. Create these top-level folders:

```bash
mkdir -p docs mva_engine tools samples output/dashboard_json output/excel output/pdf react-ui/src/components react-ui/src/data .github/workflows
```

3. Build Python normalizer:

```text
Implement source detection.
Implement SC mapping.
Implement IO mapping.
Implement Qualys mapping.
Implement severity normalization.
Implement exploit availability normalization.
Implement patch priority matrix.
Implement age calculation.
Implement stable finding keys.
```

4. Build dashboard engine:

```text
Monthly trend discovered last 3 months.
Monthly remediated last 3 months.
Current total open.
Current new vs not closed from previous.
Current open by patch priority.
Current open by age and patch priority.
Patched last month formula.
Adhoc summary.
Top 10 assets.
```

5. Build CLI:

```text
Subcommand: adhoc
Subcommand: monthly
Arguments: --snapshot, --approach, --output
```

6. Generate sample CSVs:

```text
At least 100 rows per file.
Four months.
Repeated findings across months.
New findings in each month.
Remediated findings between months.
Mixed severity and exploit availability.
Consistent expected final metrics.
```

7. Build Excel workbook generator:

```text
Use dashboard JSON as input.
Create clean dashboards.
Keep charts compact.
Avoid overlapping chart anchors.
Use consistent P1/P2/P3/P4 colors.
Create executive-friendly sheets.
```

8. Build PDF sample generator:

```text
Report title: Remediation Guide.
Create table of contents.
Create vulnerability sections.
Format commands in code boxes.
Use professional headers and footers.
Avoid internal implementation wording.
```

9. Build React UI:

```text
Sidebar navigation.
Header hero.
Source choice tiles.
Operation mode cards.
Upload panel.
Adhoc metrics dashboard.
Monthly comparison panel.
AI provider/report builder panel.
Priority matrix.
Field mapping panel.
Remediation queue.
Tool icons.
```

10. Add deployment workflow:

```text
.github/workflows/deploy-pages.yml
```

11. Add Vite base path:

```text
base: process.env.GITHUB_PAGES_BASE || "/"
```

12. Validate locally:

```bash
npm ci
npm run build
python3 -m compileall mva_engine tools
```

13. Publish:

```bash
brew install gh
gh auth login --hostname github.com --git-protocol https --web
./publish_github_pages.sh
```

## 19. Prompt to Give Claude Code or Another Team

Use this prompt to recreate or extend the tool:

```text
Build a production-quality MVA Unified vulnerability reporting tool.

Use React + Vite + Tailwind for a dark cybersecurity cockpit UI.
Use Python for scanner CSV normalization and dashboard calculations.
Do not use a database for this version.

Source tools currently required:
Tenable.sc, Tenable.io, Qualys.

Implement two workflows:
1. Adhoc scan dashboard from one CSV.
2. Monthly comparison dashboard from 2+ monthly CSV snapshots.

Monthly dashboard requirements only:
- Trend of vulnerabilities discovered in the last 3 months.
- Total open vulnerabilities.
- Total open vulnerabilities by patch priority.
- Total open vulnerabilities by age and patch priority.
- Total vulnerabilities patched in the last month using:
  previous_month_open + new_this_month - current_month_open.

Adhoc dashboard requirements only:
- Total vulnerabilities.
- Severity counts.
- Patch priority counts.
- Top 10 affected assets.

Use this priority matrix:
Exploit available + Critical = P1
Exploit available + High = P1
Exploit available + Medium = P2
Exploit available + Low = P2
No exploit + Critical = P2
No exploit + High = P2
No exploit + Medium = P3
No exploit + Low = P4

Support:
- Tenable.sc same-source monthly comparison.
- Tenable.io same-source monthly comparison.
- Mixed Tenable.sc to Tenable.io migration comparison.
- Qualys monthly comparison.
- Adhoc for Tenable.sc, Tenable.io, Qualys.

Generate 100+ row sample CSV files for each source and four months.
Generate Excel workbook dashboard outputs.
Generate industry-level Remediation Guide PDF samples.
Include GitHub Pages deployment for the React UI.
Include a detailed sample-data guide and validation commands.
```

## 20. Known Next Enhancements

Production extensions:

```text
Add backend API for real uploads from the deployed UI.
Add authentication.
Add role-based access.
Add storage or object-store integration if reports must persist.
Add MDVM mapping.
Add CrowdStrike Spotlight / Exposure Management mapping.
Add Qualys VMDR API ingestion.
Add AI provider runtime configuration.
Add server-side PDF generation endpoint.
Add job queue for 80k+ row files.
Add streaming progress updates for large uploads.
Add audit logging.
```

No-database production option:

```text
Use stateless API processing.
Store upload files temporarily in /tmp.
Generate outputs in memory or temporary files.
Return XLSX/PDF directly.
Delete files after download.
Use object storage only if retention is required.
```

## 21. Final Validation Performed

Before publishing, the following validation was performed:

```text
Installed GitHub CLI.
Authenticated GitHub as DrHayabusa.
Created public repo DrHayabusa/unified-tool.
Pushed main branch.
Enabled GitHub Pages.
Triggered Pages workflow.
Workflow build succeeded.
Workflow deploy succeeded.
Verified GitHub repo API returned 200.
Verified repo is public.
Verified Pages URL returned 200.
Verified generated HTML references /unified-tool/assets/... paths.
```

The final team URL is:

```text
https://drhayabusa.github.io/unified-tool/
```
