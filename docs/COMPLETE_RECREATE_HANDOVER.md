# MVA Unified Tool Complete Recreate Handover

> Release note, 14 July 2026: `docs/FINAL_PRODUCTION_HANDOVER.md` is the definitive current handover. This document preserves the detailed development history, but older provider names, pre-CrowdStrike status notes, and localhost API wording may describe earlier iterations.

This is the historical granular handover document for recreating the MVA Unified Tool from zero.

It is written for:

```text
Claude Code
Codex
Internal developers
Frontend engineers
Backend engineers
Vulnerability management analysts
AI/reporting engineers
```

It explains what was built, why it was built this way, how the files are organized, how the UI works, how scanner data is normalized, how dashboard metrics are calculated, how sample files were generated, how GitHub Pages deployment works, how the local API/NVIDIA test flow works, and how to rebuild the same platform step-by-step.

Do not put real API keys in this document or in GitHub.

## 1. Final Project Identity

Project name:

```text
MVA Unified Tool
```

GitHub repository:

```text
https://github.com/DrHayabusa/unified-tool
```

Live GitHub Pages UI:

```text
https://drhayabusa.github.io/unified-tool/
```

Local project path on the Mac where this was built:

```text
/Users/mohammedshahid/Documents/New project/unified-tool
```

Git branch:

```text
main
```

Deployment platform:

```text
GitHub Pages
```

Deployment workflow:

```text
.github/workflows/deploy-pages.yml
```

Current production status:

```text
Public repo exists.
GitHub Pages is enabled.
React UI builds successfully.
GitHub Actions deployment succeeds.
Live URL returns HTTP 200.
Local API server works on 127.0.0.1:8000.
NVIDIA connectivity test works from local .env.
No real API key is committed to GitHub.
```

## 2. Scope of This Build

This build is a no-database prototype/first production baseline for a vulnerability management assistant.

It supports:

```text
High-end React UI
Source tool selection
Adhoc scan workflow
Monthly comparison workflow
Tenable.sc normalization
Tenable.io normalization
Qualys normalization
Patch priority matrix
Monthly trend dashboards
Adhoc dashboard metrics
Excel reference workbooks
PDF reference reports
AI provider panel
Session-only API key input
Local API server for API connectivity tests
GitHub Pages deployment
Full sample data package
```

It intentionally does not yet include:

```text
Production authentication
Database persistence
Multi-user roles
Real browser-side CSV parsing at production scale
Server-side upload storage
Permanent report storage
Production PDF generation endpoint
MDVM implementation
CrowdStrike implementation
Qualys API ingestion
Background job queue
Audit logging
```

Important architecture note:

```text
GitHub Pages is static.
It can host the React UI.
It cannot safely store API keys.
It cannot run Python.
It cannot process huge CSVs server-side.
The backend/API must run separately for production.
```

## 3. Why This Architecture Was Chosen

The user wanted:

```text
High-end custom UI/UX
Dark cybersecurity theme
No database for now
Support for large CSV workflows
Scanner-aware dashboards
AI remediation PDF generation path
Team-shareable public link
Sample data for testing
Complete handover for rebuild
```

The selected architecture:

```text
React + Vite + Tailwind for frontend UI
Python for scanner normalization and dashboard logic
Node script for Excel workbook generation
Python/report tooling for PDFs
Local API server for API connectivity tests
GitHub Pages for public UI hosting
GitHub Actions for deployment
Git for version control and handover
```

Reasoning:

```text
React gives full control over enterprise UI/UX.
Tailwind makes dark ops-console styling fast and maintainable.
Vite gives simple build/deploy flow to GitHub Pages.
Python is strong for CSV normalization and vulnerability data logic.
Node is already used by the workbook generator.
GitHub Pages gives an immediate public URL for the team.
No database keeps the first version lightweight.
Local API server proves backend handoff without needing cloud hosting.
```

Production target architecture should become:

```text
React UI
  -> Internal backend API
      -> CSV parser / dashboard engine
      -> Excel builder
      -> PDF builder
      -> AI provider connector
      -> Temporary file cleanup
```

## 4. Final Repository Structure

```text
.
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── .env.example
├── .gitignore
├── README.md
├── SAMPLE_DATA.md
├── docs/
│   ├── AI_PDF_GENERATION_PROMPT.md
│   ├── API_KEYS.md
│   ├── BUILD_REPLICATION_GUIDE.md
│   ├── COMPLETE_RECREATE_HANDOVER.md
│   ├── FINAL_HANDOFF_AND_TESTING.md
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
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── src/
│   ├── tailwind.config.js
│   └── vite.config.js
├── samples/
│   ├── qualys_100_row/
│   ├── tenable/
│   └── tenable_100_row/
├── tools/
│   ├── build_tenable_dashboard_workbook.mjs
│   ├── generate_100plus_remediation_pdf.py
│   ├── generate_kb_remediation_pdf.py
│   ├── generate_pdf_format_options.py
│   ├── generate_qualys_100_row_samples.py
│   ├── generate_sample_pdfs.py
│   ├── generate_tenable_100_row_samples.py
│   ├── mva_api_server.py
│   ├── tenable_dashboard_cli.py
│   └── test_nvidia_connectivity.py
├── ui/
│   ├── README.md
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── publish_github_pages.sh
├── run-local-api.sh
├── run-react-ui.sh
└── run-ui.sh
```

## 5. File-by-File Purpose

### Root Files

```text
README.md
High-level overview, live run instructions, GitHub Pages notes, and project behavior.
```

```text
SAMPLE_DATA.md
Explains which sample files to upload for Tenable.sc, Tenable.io, mixed Tenable, Qualys, and adhoc tests.
```

```text
.env.example
Safe placeholder environment variables. It contains no real key. Copy to .env locally.
```

```text
.gitignore
Ignores node_modules, dist, pycache, .env, .env.*, and other local artifacts. Allows .env.example.
```

```text
publish_github_pages.sh
Creates or reuses GitHub repo, pushes main, enables Pages, triggers Pages workflow.
```

```text
run-react-ui.sh
Starts local React dev UI.
```

```text
run-local-api.sh
Starts local Python API server on 127.0.0.1:8000.
```

### React UI Files

```text
react-ui/package.json
Defines Vite/React dependencies and scripts.
```

```text
react-ui/vite.config.js
Sets Vite plugins and GitHub Pages base path.
Uses process.env.GITHUB_PAGES_BASE || "/".
```

```text
react-ui/src/App.jsx
Main UI state router.
Controls selected source, selected workflow, upload state, detected months, selected PDF month.
```

```text
react-ui/src/components/Sidebar.jsx
Real navigation only: Dashboard, Adhoc Scan, Monthly Compare.
Dead pages were removed.
```

```text
react-ui/src/components/SourceChoice.jsx
Source tiles: Tenable.sc, Tenable.io, MDVM, CrowdStrike, Qualys, Custom CSV.
```

```text
react-ui/src/components/OperationMode.jsx
Workflow selection cards: Adhoc Scan and Monthly Data Comparison.
```

```text
react-ui/src/components/UploadPanel.jsx
Adhoc upload card.
```

```text
react-ui/src/components/MonthlyComparison.jsx
Monthly upload gate, multi-file detection, month extraction, dashboard, charts, Excel/PDF action area.
```

```text
react-ui/src/components/AiReportBuilder.jsx
Provider selector, PDF month selector, session-only API key input, provider base URL, model field, API health URL, test connectivity button, generate PDF button.
```

```text
react-ui/src/components/MetricsRow.jsx
Adhoc metric cards and sparklines.
```

```text
react-ui/src/components/PriorityMatrix.jsx
Patch priority matrix display.
```

```text
react-ui/src/components/FieldMappingPanel.jsx
Mapped field display.
```

```text
react-ui/src/components/RemediationQueue.jsx
Sample remediation queue.
```

```text
react-ui/src/components/ToolIcons.jsx
Custom MVA and scanner icons.
```

```text
react-ui/src/data/dashboardData.js
Mock/sample dashboard data for frontend display.
```

### Python Engine Files

```text
mva_engine/tenable_normalizer.py
Normalizes Tenable.sc, Tenable.io, Qualys monthly, and Qualys adhoc CSV rows.
Detects source format.
Maps scanner fields into MVA normalized schema.
Calculates severity, exploit availability, priority, age, and stable keys.
```

```text
mva_engine/tenable_dashboards.py
Builds adhoc and monthly dashboard metrics.
Calculates open/new/not-closed/remediated/priority/age/trend outputs.
```

```text
tools/tenable_dashboard_cli.py
CLI interface for adhoc and monthly dashboard JSON generation.
```

```text
tools/mva_api_server.py
Dependency-free local API server.
Exposes /health, /health/nvidia, and /generate/pdf.
Reads .env and accepts session API key/base URL/model overrides from UI.
```

```text
tools/test_nvidia_connectivity.py
Command-line NVIDIA NIM connectivity test using .env or shell environment variables.
```

### Sample and Output Generation Files

```text
tools/generate_tenable_100_row_samples.py
Generates 100+ row Tenable.sc and Tenable.io monthly sample CSVs.
```

```text
tools/generate_qualys_100_row_samples.py
Generates Qualys monthly and adhoc sample CSVs.
```

```text
tools/build_tenable_dashboard_workbook.mjs
Builds Excel dashboard workbooks from dashboard JSON.
```

```text
tools/generate_100plus_remediation_pdf.py
Generates the preferred 100+ row remediation PDF sample.
```

```text
tools/generate_sample_pdfs.py
Generates multiple early PDF examples.
```

```text
tools/generate_pdf_format_options.py
Generates five PDF format options for comparison.
```

```text
tools/generate_kb_remediation_pdf.py
Generates KB-style remediation PDF content.
```

## 6. GitHub Pages Deployment

Workflow file:

```text
.github/workflows/deploy-pages.yml
```

Workflow behavior:

```text
Trigger: push to main or manual workflow_dispatch
Permissions: contents read, pages write, id-token write
Build job:
  checkout
  setup Node
  npm ci in react-ui
  npm run build in react-ui
  GITHUB_PAGES_BASE=/unified-tool/
  upload react-ui/dist artifact
Deploy job:
  deploy artifact to GitHub Pages
```

Vite GitHub Pages support:

```js
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES_BASE || "/",
});
```

Why this matters:

```text
Without base=/unified-tool/, GitHub Pages would load index.html but fail to find JS/CSS assets.
```

Publish command:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
./publish_github_pages.sh
```

Manual equivalent:

```bash
gh repo create DrHayabusa/unified-tool --public
git remote add origin https://github.com/DrHayabusa/unified-tool.git
git push -u origin main
gh api --method POST repos/DrHayabusa/unified-tool/pages -f build_type=workflow
gh workflow run "Deploy React UI to GitHub Pages" --repo DrHayabusa/unified-tool
```

Verify:

```bash
curl -L -I https://drhayabusa.github.io/unified-tool/
```

Expected:

```text
HTTP 200
```

## 7. UI Design Requirements Implemented

The UI was based on a dark cybersecurity cockpit concept.

Visual direction:

```text
Slate-950 background
Neon green/cyan/amber accents
Red/orange/yellow/green vulnerability severity palette
Subtle card borders
Radar/bug/security motif
High contrast cards
Responsive layout
Tool-specific source cards
Metric cards with sparklines
Line and bar charts
AI provider panel
Priority matrix panel
```

Final sidebar:

```text
Dashboard
Adhoc Scan
Monthly Compare
```

Dead pages intentionally removed:

```text
Upload
History
AI Agent
Reports
```

Why removed:

```text
They were visible but not separate working pages.
Upload, AI, and reports are now inside the actual workflows.
History is not implemented because no database exists yet.
```

## 8. UI Workflow Behavior

### Dashboard Landing

The landing view shows:

```text
Source selection
Operation mode selection
Source-aware dashboard hint
Exploit-aware priority hint
AI PDF generation hint
Session state
Compact AI panel
```

### Adhoc Scan

Flow:

```text
Select source
Select Adhoc Scan
Upload one CSV/XLSX or use sample upload
Click Analyze & Generate Adhoc Dashboard
See metrics, field mapping, priority matrix, remediation queue
Use AI Report Builder panel
```

Adhoc outputs:

```text
Total vulnerabilities
Severity counts
Patch priority counts
Top 10 affected assets
AI PDF panel
```

### Monthly Compare

Flow:

```text
Select source
Select Monthly Data Comparison
Choose same-source or mixed/migration approach
Select at least two monthly exports
File names are parsed for month/year
UI shows detected report count and month chips
Click Analyze & Generate Excel Report
Dashboard appears
PDF Month selector is populated from detected months
AI Report Builder appears
Test API connectivity
Generate AI PDF Report
```

Monthly upload rule:

```text
At least 2 files are required.
1 file is blocked because new/not-closed/patched comparison needs a previous month.
```

Month detection:

```text
Filenames are parsed for month aliases and year.
Examples: april, apr, july, jul, 2026.
Detected months are sorted chronologically.
Duplicate month labels are removed.
```

If month names are not detected:

```text
The UI still shows files selected.
It falls back to default sample months only for sample mode or post-analysis fallback.
Best practice is to name files with Month YYYY.
```

Recommended file naming:

```text
tenable_sc_april_2026_100plus.csv
tenable_sc_may_2026_100plus.csv
tenable_sc_june_2026_100plus.csv
tenable_sc_july_2026_100plus.csv
```

## 9. Supported Sources

Currently implemented in backend logic:

```text
Tenable.sc
Tenable.io
Qualys monthly
Qualys adhoc
```

Currently represented in UI for roadmap:

```text
MDVM
CrowdStrike
Custom CSV
```

Important:

```text
MDVM, CrowdStrike, and Custom CSV are UI placeholders until fields are provided and normalizers are implemented.
```

## 10. Normalized MVA Schema

The reporting target fields are:

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

Additional internal fields used by the engine:

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

The normalized fields make it possible to compare different scanner exports.

## 11. Tenable.sc Mapping

Important Tenable.sc input fields:

```text
IP Address
DNS Name
NetBIOS Name
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
Repository
```

Mapping:

```text
IP Address -> IP Address
DNS Name -> DNS Name
Plugin Name -> Vulnerability Name
CVE -> CVE
Severity / Risk Factor -> Severity
Exploit? / Exploit Ease -> Exploit Availability
Plugin Output -> Vulnerability Finding
Synopsis -> Summary
Description -> Description
Steps to Remediate -> Remediation
See Also / Cross References -> KB Links
First Discovered -> First Discovered
Last Observed -> Last Observed
Port -> Port
Protocol -> Protocol
Plugin -> Plugin/Vulnerability ID
```

## 12. Tenable.io Mapping

Important Tenable.io input fields:

```text
asset.display_ipv4_address
asset.display_fqdn
asset.host_name
asset.netbios_name
definition.name
definition.cve
severity
definition.severity
definition.exploitability_ease
definition.exploited_by_malware
definition.exploited_by_nessus
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
state
last_fixed
```

Mapping:

```text
asset.display_ipv4_address -> IP Address
asset.display_fqdn / asset.host_name -> DNS Name
definition.name -> Vulnerability Name
definition.cve -> CVE
severity / definition.severity -> Severity
definition.exploitability_ease -> Exploit Availability
definition.description -> Description
definition.synopsis -> Summary
definition.solution -> Remediation
definition.see_also -> KB Links
first_observed -> First Discovered
last_seen -> Last Observed
vuln_age / age_in_days -> age_days
port -> Port
protocol -> Protocol
definition.id -> Plugin/Vulnerability ID
state / last_fixed -> status/remediation evidence
```

Special IO behavior:

```text
If vuln_age or age_in_days exists, use it directly for age buckets.
```

## 13. Qualys Mapping

Qualys monthly fields used:

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
FQDN
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

Qualys adhoc fields used:

```text
IP
DNS
NetBIOS
QID
Title
Severity
Port
Protocol
FQDN
CVE ID
Threat
Impact
Solution
Exploitability
Associated Malware
Results
Category
```

Mapping:

```text
IP -> IP Address
DNS / FQDN / NetBIOS -> DNS Name
Title -> Vulnerability Name
CVE ID -> CVE
Severity -> Severity
Exploitability / Associated Malware -> Exploit Availability
Threat -> Summary
Impact -> Description
Solution -> Remediation
Results -> Vulnerability Finding
First Detected -> First Discovered
Last Detected -> Last Observed
Date Last Fixed -> last_fixed/remediation evidence
Vuln Status -> open/fixed filtering
QID -> Plugin/Vulnerability ID
```

Qualys severity normalization:

```text
5 -> Critical
4 -> High
3 -> Medium
2 -> Low
1 or 0 -> Info
```

Qualys monthly filtering:

```text
Fixed
Closed
Resolved
Remediated
Ignored
```

These statuses are treated as not open in monthly dashboards.

## 14. Exploit Availability Logic

Exploit availability is normalized to:

```text
Available
Unavailable
Unknown
```

Tenable.sc exploit signals:

```text
Exploit?
Exploit Ease
Exploit Frameworks
```

Tenable.io exploit signals:

```text
definition.exploitability_ease
definition.exploited_by_malware
definition.exploited_by_nessus
definition.vpr drivers
definition.vpr_v2 drivers
```

Qualys exploit signals:

```text
Exploitability
Associated Malware
```

Examples considered available:

```text
Yes
Available
Exploit available
Exploited by malware
Exploited by Nessus
Functional exploit exists
High
Medium
```

Examples considered unavailable:

```text
No
Unavailable
Unproven
Not available
None
```

## 15. Priority Matrix

Priority depends on severity and exploit availability.

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

Meaning:

```text
P1 = Immediate remediation lane
P2 = Priority patch lane
P3 = Planned remediation lane
P4 = Deferred hardening lane
```

Colors:

```text
Critical = red
High = orange
Medium = yellow/amber
Low = green
P1 = red
P2 = orange
P3 = amber
P4 = green
```

## 16. Monthly Dashboard Requirements

The user explicitly requested only these dashboards:

```text
Trend of vulnerabilities discovered in last 3 months
Total open vulnerabilities
Total open vulnerabilities by patch priority
Total open vulnerabilities by age and patch priority
Total vulnerabilities patched in the last month
```

No extra useless dashboards should be added without user approval.

Monthly formulas:

```text
current_open = count of current month open finding keys
previous_open = count of previous month open finding keys
new_this_month = current finding keys not present in previous month
not_closed_from_previous_months = current finding keys also present in previous month
patched_last_month = previous_open + new_this_month - current_open
```

The engine also calculates:

```text
patched_count_by_key_diff = previous finding keys not present in current finding keys
```

This is a sanity check against the formula result.

Age buckets:

```text
>7 days
>30 days
>60 days
>180 days (6+ months)
```

Age-by-priority table:

```text
P1 x all age buckets
P2 x all age buckets
P3 x all age buckets
P4 x all age buckets
```

## 17. Adhoc Dashboard Requirements

The user requested simple adhoc dashboards.

Adhoc outputs:

```text
Total vulnerabilities
Severity counts
Patch priority counts
Top 10 affected assets
```

Adhoc does not calculate:

```text
New vs repeated
Patched last month
Monthly trend
```

Reason:

```text
Adhoc has one file only, so no previous month exists for comparison.
```

## 18. Stable Finding Key Logic

Monthly comparison requires a stable key across months and formats.

The key combines:

```text
asset identity
vulnerability/plugin/QID/CVE/title
port
protocol
```

Purpose:

```text
Detect repeated findings across months.
Detect new findings.
Detect remediated findings.
Allow mixed Tenable.sc and Tenable.io comparison.
```

Asset identity can come from:

```text
IP Address
DNS Name
FQDN
host_name
NetBIOS
asset id
```

Vulnerability identity can come from:

```text
Plugin ID
Definition ID
QID
CVE
Vulnerability title/name
```

## 19. Sample Data Package

Sample data location:

```text
samples/
```

Tenable.sc 100+ row monthly files:

```text
samples/tenable_100_row/tenable_sc_april_2026_100plus.csv
samples/tenable_100_row/tenable_sc_may_2026_100plus.csv
samples/tenable_100_row/tenable_sc_june_2026_100plus.csv
samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
```

Tenable.io 100+ row monthly files:

```text
samples/tenable_100_row/tenable_io_april_2026_100plus.csv
samples/tenable_100_row/tenable_io_may_2026_100plus.csv
samples/tenable_100_row/tenable_io_june_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
```

Mixed Tenable migration test:

```text
April = Tenable.sc
May = Tenable.sc
June = Tenable.io
July = Tenable.io
```

Qualys 100+ row monthly files:

```text
samples/qualys_100_row/qualys_monthly_april_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_may_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_june_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_july_2026_100plus.csv
```

Adhoc files:

```text
samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
samples/qualys_100_row/qualys_adhoc_july_2026_100plus.csv
```

Expected final-month metrics:

```text
Total open: 125
New this month: 30
Not closed from previous months: 95
Remediated last month: 25
Patch priority split: P1 41, P2 31, P3 26, P4 27
```

Expected adhoc metrics:

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

## 20. Excel Outputs

Excel outputs live in:

```text
output/excel/
```

Important workbooks:

```text
output/excel/tenable_sc_multimonth_dashboard_sample.xlsx
output/excel/tenable_io_multimonth_dashboard_sample.xlsx
output/excel/tenable_mixed_sc_io_dashboard_sample.xlsx
output/excel/qualys_100plus_dashboard_sample.xlsx
```

Excel design changes made:

```text
Removed overly black appearance.
Reduced oversized headers.
Improved colors.
Made SC and IO colors consistent.
Changed "snapshot" wording to "report".
Reduced chart sizes.
Separated dashboard sections.
Avoided chart overlap.
Used line charts for vulnerability discovered/remediated trends.
Used compact patch-priority distribution.
Improved age-by-priority spacing.
```

Workbook integrity validation:

```text
Open as ZIP.
Check [Content_Types].xml exists.
Check xl/workbook.xml exists.
Run testzip.
Inspect chart anchor positions.
Confirm PDFs begin with %PDF.
```

## 21. PDF Outputs

PDF outputs live in:

```text
output/pdf/
```

Preferred PDF:

```text
output/pdf/mva_100plus_remediation_guide.pdf
```

PDF requirements from user:

```text
Title should be Remediation Guide.
No customer name.
No "prepared from KB" wording.
No "created by" wording.
No unnecessary purpose section.
Report type should be remediation.
Tool source should match selected tool.
Table of contents should be clean.
Commands should appear in clean command boxes like Notion/Obsidian.
Industry-level customer-facing format.
Vulnerability sections should include remediation steps from KB/reference links where available.
```

AI server target behavior:

```text
CSV comparison happens locally.
Normalized findings and selected month are sent to AI server.
AI server writes remediation content.
PDF builder formats final report in approved style.
```

Current implementation:

```text
Static PDF samples exist.
UI can send placeholder request to local /generate/pdf endpoint.
Production PDF generation endpoint is not fully wired yet.
```

## 22. AI Provider and API Key Handling

Supported UI provider list:

```text
Local AI Server
NVIDIA NIM
Groq
OpenRouter
Template Only
```

NVIDIA model configured:

```text
nvidia/nemotron-3-ultra-550b-a55b
```

NVIDIA base URL:

```text
https://integrate.api.nvidia.com/v1
```

Safe key storage:

```text
.env
```

Example `.env`:

```text
NVIDIA_API_KEY=replace_with_your_nvidia_key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3-ultra-550b-a55b
```

Security rule:

```text
Do not commit real API keys.
Do not hard-code keys into React.
Do not put keys into Markdown docs.
Do not put keys into sample files.
Do not put keys into screenshots.
```

The UI has session-only fields:

```text
API Key (session only)
Provider Base URL
Model
```

Session behavior:

```text
Value is kept in React state.
Value is not saved to localStorage.
Value is not committed.
Value clears on page refresh.
Value is sent to configured local/backend endpoint only when user clicks test/generate.
```

Local API endpoints:

```text
GET  /health
GET  /health/nvidia
POST /health/nvidia
POST /generate/pdf
```

POST `/health/nvidia` accepts:

```json
{
  "apiKey": "session key",
  "baseUrl": "https://integrate.api.nvidia.com/v1",
  "model": "nvidia/nemotron-3-ultra-550b-a55b"
}
```

Cloud-only API behavior:

```text
If the frontend is hosted on GitHub Pages, Vercel, Netlify, or another cloud host,
do not leave the API Server Health URL as http://127.0.0.1:8000/health/nvidia.

127.0.0.1 means "the current user's laptop", not the cloud backend.
For production, deploy the API server to an internal HTTPS endpoint and paste that
backend endpoint into the UI.
```

Example cloud endpoint:

```text
https://mva-api.company.com/health/nvidia
```

Expected cloud backend responsibilities:

```text
Store real API keys as server-side environment variables.
Expose /health for generic backend checks.
Expose /health/nvidia for provider-specific checks.
Expose /generate/pdf for Remediation Guide PDF generation.
Accept normalized vulnerability rows from the frontend or from a secure upload workflow.
Call NVIDIA/Groq/OpenRouter/local model routes from the backend only.
Return a PDF file or downloadable report URL.
Enable CORS only for the approved frontend domain.
```

Cloud deployment options:

```text
Internal VM behind VPN.
Container on Kubernetes.
Docker container on a hardened Linux server.
Azure App Service / AWS ECS / Google Cloud Run.
Internal reverse proxy with TLS.
```

## 23. Running Locally

Clone:

```bash
git clone https://github.com/DrHayabusa/unified-tool.git
cd unified-tool
```

Run React UI locally:

```bash
cd react-ui
npm ci
npm run dev
```

Open:

```text
http://127.0.0.1:8800/
```

Run local API server:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
./run-local-api.sh
```

Health:

```bash
curl http://127.0.0.1:8000/health
```

NVIDIA health:

```bash
curl http://127.0.0.1:8000/health/nvidia
```

Test NVIDIA from CLI:

```bash
python3 tools/test_nvidia_connectivity.py
```

## 24. Validation Commands

Run React production build:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool/react-ui"
npm ci
npm run build
```

Run Python compile:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
python3 -m compileall mva_engine tools
```

Run secret scan:

```bash
rg -n "nvapi-|NVIDIA_API_KEY=nvapi|OPENAI_API_KEY=sk-|GROQ_API_KEY=.*[A-Za-z0-9]{20}|OPENROUTER_API_KEY=.*[A-Za-z0-9]{20}|sk-[A-Za-z0-9]" . \
  -g '!react-ui/node_modules/**' \
  -g '!react-ui/dist/**'
```

Validate Tenable.sc monthly:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --approach same-source \
  --snapshot "April 2026=samples/tenable_100_row/tenable_sc_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_sc_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_sc_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_sc_july_2026_100plus.csv"
```

Validate Tenable.io monthly:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --approach same-source \
  --snapshot "April 2026=samples/tenable_100_row/tenable_io_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_io_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_io_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_io_july_2026_100plus.csv"
```

Validate mixed Tenable:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --approach mixed-tenable \
  --snapshot "April 2026=samples/tenable_100_row/tenable_sc_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_sc_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_io_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_io_july_2026_100plus.csv"
```

Validate Qualys monthly:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --snapshot "April 2026=samples/qualys_100_row/qualys_monthly_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/qualys_100_row/qualys_monthly_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/qualys_100_row/qualys_monthly_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/qualys_100_row/qualys_monthly_july_2026_100plus.csv"
```

Validate adhoc:

```bash
python3 tools/tenable_dashboard_cli.py adhoc samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
python3 tools/tenable_dashboard_cli.py adhoc samples/tenable_100_row/tenable_io_july_2026_100plus.csv
python3 tools/tenable_dashboard_cli.py adhoc samples/qualys_100_row/qualys_adhoc_july_2026_100plus.csv
```

Validate deployed URL:

```bash
curl -L -I https://drhayabusa.github.io/unified-tool/
```

Expected:

```text
HTTP 200
```

## 25. Troubleshooting

### GitHub Pages Shows 404

Cause:

```text
Repo does not exist, Pages not enabled, workflow failed, or Pages has not propagated.
```

Fix:

```bash
gh repo view DrHayabusa/unified-tool
gh run list --repo DrHayabusa/unified-tool --workflow "Deploy React UI to GitHub Pages"
```

If repo does not exist:

```bash
./publish_github_pages.sh
```

If Pages not enabled:

```text
GitHub repo -> Settings -> Pages -> Source: GitHub Actions
```

### API Test Says Could Not Reach Server

Cause:

```text
Local API server is not running.
Wrong health URL.
Browser cannot reach 127.0.0.1 from current environment.
CORS blocked.
VPN/proxy issue.
```

Fix:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
./run-local-api.sh
```

Use:

```text
http://127.0.0.1:8000/health/nvidia
```

### Monthly Upload Says 1 File Selected

Cause:

```text
The browser received only one file.
```

Fix:

```text
Use Command-click or Shift-click to select multiple CSVs.
Or click Use sample multi-month files.
```

Monthly comparison requires at least 2 files.

### Month Dropdown Says No Month Detected

Cause:

```text
Filename does not contain a month and year.
```

Fix:

```text
Rename files with month and year.
Example: tenable_sc_july_2026_100plus.csv
```

### NVIDIA 401 Unauthorized

Cause:

```text
Wrong API key.
Expired key.
Extra space/newline.
Key not authorized for selected model.
Model name wrong.
```

Fix:

```text
Regenerate NVIDIA key.
Paste into .env or session-only UI field.
Use model nvidia/nemotron-3-ultra-550b-a55b.
Use base URL https://integrate.api.nvidia.com/v1.
```

### React Build Says vite Not Found

Cause:

```text
node_modules missing.
```

Fix:

```bash
cd react-ui
npm ci
npm run build
```

## 26. Rebuild From Zero Checklist

1. Create repo and folders.

```bash
mkdir unified-tool
cd unified-tool
mkdir -p docs mva_engine tools samples output/dashboard_json output/excel output/pdf react-ui/src/components react-ui/src/data .github/workflows
```

2. Initialize React.

```bash
cd react-ui
npm init -y
npm install react react-dom lucide-react recharts
npm install -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer
```

3. Add Vite config with GitHub Pages base.

```text
base: process.env.GITHUB_PAGES_BASE || "/"
```

4. Build frontend components.

```text
App
Sidebar
HeroHeader
SourceChoice
OperationMode
UploadPanel
MonthlyComparison
AiReportBuilder
MetricsRow
PriorityMatrix
FieldMappingPanel
RemediationQueue
ToolIcons
TrendPanel
```

5. Build Python normalizer.

```text
Detect source.
Normalize Tenable.sc.
Normalize Tenable.io.
Normalize Qualys monthly.
Normalize Qualys adhoc.
Calculate severity.
Calculate exploit availability.
Calculate patch priority.
Calculate age.
Create stable keys.
```

6. Build dashboard engine.

```text
Adhoc metrics.
Monthly comparison.
Trend discovered.
Trend remediated.
Open by priority.
Age by priority.
Patched last month formula.
```

7. Generate samples.

```text
4 months
100+ rows each
SC set
IO set
Mixed set
Qualys set
Adhoc set
```

8. Build Excel outputs.

```text
Clean headers.
Line charts.
Priority chart.
Age matrix.
No chart overlap.
Consistent colors.
```

9. Build PDF examples.

```text
Remediation Guide
TOC
Vulnerability sections
Command boxes
Professional header/footer
No internal wording
```

10. Build local API server.

```text
/health
/health/nvidia
/generate/pdf
.env loading
session override support
CORS headers
```

11. Add GitHub Pages workflow.

```text
deploy-pages.yml
```

12. Validate.

```bash
npm run build
python3 -m compileall mva_engine tools
python3 tools/test_nvidia_connectivity.py
curl http://127.0.0.1:8000/health/nvidia
```

13. Publish.

```bash
gh auth login
./publish_github_pages.sh
```

14. Verify.

```bash
curl -L -I https://drhayabusa.github.io/unified-tool/
```

## 27. Prompt for Claude Code or Codex to Recreate

Use this prompt with Claude Code or Codex:

```text
Build a no-database MVA Unified vulnerability reporting tool.

Use React + Vite + Tailwind for the frontend.
Use Python for scanner CSV normalization and dashboard calculations.
Use a local Python API server for AI provider connectivity tests.
Use GitHub Pages for static UI deployment.

Implement sources:
Tenable.sc
Tenable.io
Qualys monthly
Qualys adhoc

Show roadmap tiles for:
MDVM
CrowdStrike
Custom CSV

Implement workflows:
Dashboard landing/config page
Adhoc Scan
Monthly Compare
AI Remediation Guide PDF panel

For monthly dashboards, include only:
Trend of vulnerabilities discovered in last 3 months
Total open vulnerabilities
Total open vulnerabilities by patch priority
Total open vulnerabilities by age and patch priority
Total vulnerabilities patched in last month

For adhoc dashboards, include only:
Total vulnerabilities
Severity counts
Patch priority counts
Top 10 affected assets

Priority matrix:
Exploit available + Critical = P1
Exploit available + High = P1
Exploit available + Medium = P2
Exploit available + Low = P2
No exploit + Critical = P2
No exploit + High = P2
No exploit + Medium = P3
No exploit + Low = P4

Monthly formula:
patched_last_month = previous_month_open + new_this_month - current_month_open

Create 100+ row sample CSVs for four months.
Create Tenable.sc, Tenable.io, mixed SC/IO, Qualys, and adhoc samples.
Create reference Excel workbooks.
Create reference remediation PDFs.
Add GitHub Pages workflow.
Add .env.example.
Do not commit real API keys.
Add session-only API key, base URL, and model fields in the AI panel.
Add local API server endpoints:
GET /health
GET /health/nvidia
POST /health/nvidia
POST /generate/pdf

Validate with npm build, Python compile, dashboard CLI tests, API tests, and GitHub Pages HTTP 200.
```

## 28. Acceptance Criteria

The recreated tool is acceptable only when:

```text
React builds successfully.
GitHub Pages returns HTTP 200.
Sidebar has no dead pages.
Monthly upload supports multiple files.
Monthly upload blocks one-file analysis.
Detected months populate PDF month dropdown.
Adhoc workflow displays metrics after upload/sample.
Monthly workflow displays dashboards after analysis.
AI panel has provider, API key, base URL, model, health URL, test, and generate buttons.
Local API /health returns 200.
Local API /health/nvidia returns 200 with valid NVIDIA key.
NVIDIA CLI test returns OK.
No real API key is committed.
Sample data exists for SC, IO, mixed Tenable, Qualys, adhoc.
Reference Excel files open without repair.
Reference PDFs start with %PDF.
Docs include rebuild, API key, sample data, and troubleshooting guidance.
```

## 29. Current Known Limitations

```text
Public GitHub Pages frontend is static.
Real CSV processing in deployed UI is mocked/sample-driven.
Production backend is required for real uploads and generated downloads.
Generate AI PDF endpoint is a placeholder.
MDVM and CrowdStrike mappings are not implemented yet.
Authentication and roles are not implemented.
History page is intentionally not included because no database exists.
No persistent storage exists.
No job queue exists for 80k+ row production processing yet.
```

## 30. Recommended Next Production Steps

1. Build backend API.

```text
FastAPI or Flask
Upload endpoint
Monthly compare endpoint
Adhoc endpoint
Excel download endpoint
PDF generation endpoint
Health endpoints
Provider config endpoint
```

2. Add temporary file handling.

```text
Store uploaded CSVs in /tmp.
Process in worker.
Delete files after report generation.
```

3. Add 80k+ row performance support.

```text
Streaming CSV parser
Chunked processing
Progress events
Worker queue
Memory caps
Timeout controls
```

4. Add enterprise deployment.

```text
Internal VM
Docker
Reverse proxy
TLS
SSO
Role-based access
Audit logs
Secrets manager
```

5. Add remaining source mappings.

```text
MDVM fields
Qualys API variants beyond the supplied exports
Custom CSV field mapper
```

6. Wire real PDF generation.

```text
Normalize rows
Select month
Fetch/parse KB links when allowed
Send structured prompt to AI server
Receive remediation guide content
Render PDF in approved template
Return PDF download
```

## 31. Final Verification Snapshot

At handover time:

```text
Repo exists: yes
Repo public: yes
Pages enabled: yes
Pages URL HTTP 200: yes
React build: passing
React data/PDF and cross-source regression tests: 11/11 passing
Python CrowdStrike/regression tests: 19/19 passing
Explicit release checks: 496/496 passing
80,000-row normalization/dashboard test: passing
JavaScript 80,000-row browser-engine test: passing
Excel reopen, integrity, formula, and all-sheet visual checks: passing
PDF structure, content, links, and all-page visual checks: passing
npm dependency audit: 0 vulnerabilities
NVIDIA live endpoint: requires a fresh user session key and trial quota
No tracked real API key: yes
```

Final links:

```text
Repo: https://github.com/DrHayabusa/unified-tool
Live UI: https://drhayabusa.github.io/unified-tool/
Samples: https://github.com/DrHayabusa/unified-tool/tree/main/samples
```

## 32. CrowdStrike Release Addendum

CrowdStrike `Vulnerabilities`, `Vulnerability per asset`, and weighted `Remediation per assets` exports are now implemented. The detailed mapping, source detection, dashboard formulas, PDF contract, NVIDIA model choice, synthetic data, test commands, and measured validation evidence are documented in:

```text
docs/CROWDSTRIKE_IMPLEMENTATION.md
```

This addendum supersedes earlier statements in this historical build log that listed CrowdStrike as future work.
