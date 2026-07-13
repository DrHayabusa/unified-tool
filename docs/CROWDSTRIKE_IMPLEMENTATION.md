# CrowdStrike Implementation And Release Handover

## 1. Scope

MVA supports all three CrowdStrike Exposure Management CSV selections supplied for this release:

| Export selection | Processing model | Adhoc | Monthly |
|---|---|---:|---:|
| Vulnerabilities | One normalized finding per open vulnerability/asset row | Yes | Yes |
| Vulnerability per asset | Same detailed field family and normalized behavior | Yes | Yes |
| Remediation per assets | Aggregated remediation rows weighted by `Count` | Yes | No |

Monthly comparison intentionally rejects `Remediation per assets` because an aggregate recommendation row does not provide a stable per-vulnerability identifier required to calculate new, carried, and patched findings accurately.

## 2. Source Detection

Detection runs against CSV headers before normalization.

Detailed CrowdStrike detection requires the identifying fields `Hostname`, `CVE ID`, `Vulnerability ID`, and `Exploit status label`.

Aggregated remediation detection requires `Hostname`, `RecommendedRemediation`, `Count`, and `ExPRT Critical`.

The parser never relies only on a filename. A filename is used to identify the reporting month, while headers determine the source/export family.

## 3. Detailed Field Mapping

| MVA field | CrowdStrike source fields |
|---|---|
| IP Address | `LocalIP` |
| DNS Name | `Hostname` |
| Vulnerability Name | `CVE Description` |
| Source Finding ID | `Vulnerability ID`, then `Vulnerability Metadata ID` |
| CVE | `CVE ID` |
| Severity | `Severity` |
| Exploit Availability | `Exploit status label`, `Exploit status value`, or `Is CISA KEV` |
| Patch Priority | Approved severity/exploit matrix |
| Asset Exposure | Severity, exploit, KEV, internet exposure, asset criticality, CVSS/ExPRT signals; capped at 1000 |
| Vulnerability Finding | `Evaluation logic`, `Simplified Evaluation Logic`, or `Results` when available |
| Summary | `CVE Description` |
| Description | `CVE Description` plus evaluation context |
| Remediation | `Recommended Remediations`, `Remediation Details`, `Minimum Remediation`, `Minimum Remediation Details`, `AdditionalRemediationSteps` |
| KB Links | `Vendor Advisory`, `References`, `Remediation Links`, `Minimum Remediation Links`, `Minimum Remediation Advisory URL`, `AdditionalRemediationAdvisoryUrl` |
| Platform Details | `Platform`, `OSVersion`, `OS Build`, `Product`, vulnerable versions |
| First Discovered | `Created Date` |
| Last Observed | `Last Scan Time` or reporting month end |
| Vulnerability Age | Difference between reporting date and `Created Date` |

Rows with a closed status, a populated closed date, an inactive/closed instance state, or `Is Suppressed = Yes` are excluded from open dashboards.

## 4. Remediation-Per-Assets Mapping

| MVA field | CrowdStrike source fields |
|---|---|
| IP Address | `LocalIP` |
| DNS Name | `Hostname` |
| Vulnerability Name | `RecommendedRemediation` |
| Severity | Highest non-zero value among `Critical`, `High`, `Medium`, `Low`, `Unknown` |
| Record Count | `Count` |
| Exploit Availability | `Exploits` |
| Remediation | `RecommendedRemediation`, `RemediationDetail`, `AdditionalRemediationSteps` |
| KB Links | `AdditionalRemediationAdvisoryUrl` |
| Platform Details | `Platform`, `OSVersion`, `Products` |
| Asset Exposure | Severity, exploit, internet exposure, asset criticality, and ExPRT enrichment; capped at 1000 |

Every dashboard count uses `record_count`. A 100-row aggregate CSV can therefore correctly represent 542 findings rather than being incorrectly reported as 100.

## 5. Exploit And Priority Logic

Detailed exports are marked exploit-available when either CrowdStrike exploit status indicates confirmed/available/weaponized/exploited/PoC evidence or the row is in CISA KEV. ExPRT is retained as useful risk enrichment but is not by itself treated as proof of available exploit code.

| Severity | Exploit available | No exploit evidence |
|---|---:|---:|
| Critical | P1 | P2 |
| High | P1 | P2 |
| Medium | P2 | P3 |
| Low | P2 | P4 |

## 6. Monthly Dashboard Contract

Only the five requested dashboards are treated as the core monthly contract:

1. Vulnerabilities Discovered - Last 3 Months, shown as a line chart.
2. Total Open Vulnerabilities = new findings + findings not closed from the prior report.
3. Total Open by Patch Priority using P1, P2, P3, and P4 colors.
4. Open Findings by Age and Patch Priority using cumulative `>7`, `>30`, `>60`, and `>180` day thresholds.
5. Vulnerabilities Patched - Last 3 Months, shown as a line chart. Latest month formula: previous open + current-month new - current open.

The CrowdStrike dashboard also exposes four source-specific operational signals without replacing the core contract: exploit available, CISA KEV, internet exposed, and critical assets.

## 7. Adhoc Dashboard Contract

The adhoc dashboard provides total open, severity counts, immediate patch needed (P1 + P2), distinct affected assets, top 10 affected assets, priority distribution, a searchable remediation queue, and CrowdStrike exposure signals when those fields exist.

The aggregated test export produces:

```text
542 weighted open findings
45 affected assets
98 Critical
123 High
148 Medium
173 Low
```

## 8. Excel Output

The curated workbook has three sheets:

- `Executive Dashboard`: five required monthly views with separate discovered and remediated trend charts.
- `Monthly Dashboard`: monthly totals, priority cards, aging matrix, and patched calculation.
- `Adhoc Dashboard`: weighted aggregate totals, severity/priority distributions, and top 10 assets.

There is no `Lane` field or heading. Final validation reopens the exported workbook, scans for formula errors, checks ZIP integrity, and renders every sheet through `@oai/artifact-tool`.

## 9. Remediation Guide PDF

The report title is `Remediation Guide`. It contains tool source, reporting month, contents, summary, unique vulnerability actions grouped by CVE, affected counts/assets, clickable advisory links, clean command blocks, and validation expectations. It intentionally omits customer name, purpose, created-by text, and internal generation wording.

The AI prompt enforces the same contract and instructs the model not to invent versions, KB numbers, CVEs, URLs, or validation results. Only prioritized normalized data for the selected month is sent when the analyst explicitly requests AI generation.

## 10. NVIDIA Model Selection

Recommended strongest NVIDIA Build model:

```text
Model: nvidia/nemotron-3-ultra-550b-a55b
Base URL: https://integrate.api.nvidia.com/v1
```

NVIDIA describes Ultra as 550B parameters with 55B active, up to 1M context, and best suited to frontier reasoning, complex agent workflows, long-context analysis, tool use, and high-stakes RAG. It uses the OpenMDW 1.1 license and NVIDIA lists a free prototype endpoint. The hosted endpoint is governed by NVIDIA API Trial Terms, so production availability, quota, and organizational approval must be confirmed rather than assuming it is permanently free.

Official references:

- https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b
- https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b/modelcard
- https://build.nvidia.com/nvidia

For lower latency or lower cost, the UI also lists Nemotron 3 Super and Nano. Ultra remains the quality-first choice for the remediation-writing workload.

## 11. Security Architecture

CSV parsing, source detection, normalization, comparison, and local Excel/PDF generation run in browser memory. No database is required.

Session-pasted API keys stay in React state and are not committed or stored in GitHub. A direct Build API call is suitable for controlled testing. Enterprise production should use an organization-controlled cloud API proxy with authentication, CORS allowlisting, secret management, rate limiting, request-size limits, audit logging, and outbound allowlisting to NVIDIA.

Never hard-code provider keys into the public GitHub Pages bundle. Rotate any key that was pasted into chat, source control, screenshots, or logs.

## 12. Test Data

```text
samples/crowdstrike_100_row/crowdstrike_vulnerabilities_april_2026_100plus.csv
samples/crowdstrike_100_row/crowdstrike_vulnerabilities_may_2026_100plus.csv
samples/crowdstrike_100_row/crowdstrike_vulnerabilities_june_2026_100plus.csv
samples/crowdstrike_100_row/crowdstrike_vulnerabilities_july_2026_100plus.csv
samples/crowdstrike_100_row/crowdstrike_vulnerability_per_asset_july_2026_100plus.csv
samples/crowdstrike_100_row/crowdstrike_remediation_per_assets_july_2026_100plus.csv
```

The same files are bundled under `react-ui/public/sample-data/crowdstrike/` so the deployed `Load test pack` buttons exercise real CSV parsing rather than mock dashboard objects.

## 13. Validation Evidence

Release commands:

```bash
python3 -m unittest -v tests.test_crowdstrike_and_regressions
python3 tools/run_release_validation.py
node tools/run_browser_80k_validation.mjs
cd react-ui
npm test
npm run build
npm audit --audit-level=moderate
```

Validated release result:

```text
496 / 496 explicit release checks passed
19 / 19 Python test methods passed
11 / 11 React/data/PDF and cross-source regression tests passed
80,000 rows normalized in 3.39 seconds
80,000-row dashboard built in 0.42 seconds
JavaScript 80,000-row parse + normalize + dashboard: 1.77 seconds
npm audit: 0 vulnerabilities
```

Machine performance varies; the numbers above are evidence from the release Mac, not a universal service-level guarantee.

Evidence locations:

```text
output/validation/RELEASE_VALIDATION.md
output/validation/release_validation.json
output/validation/browser_80000_rows.json
output/validation/workbook/validation.json
output/validation/pdf-crowdstrike-final/validation.json
output/validation/screenshots/
```

## 14. Rebuild Sequence

1. Preserve the normalized MVA schema and finding-key rules.
2. Add source detection before normalization.
3. Implement detailed and aggregate CrowdStrike mappings separately.
4. Apply weighting to every count and chart, not only the headline total.
5. Keep monthly comparison restricted to stable detailed identifiers.
6. Implement the five dashboard formulas in one shared data engine.
7. Bind the React UI to computed dashboard objects, not mock values.
8. Generate browser downloads lazily so ExcelJS and jsPDF do not block initial load.
9. Keep AI optional; local comparison must work without an API key.
10. Run field-level, regression, 80,000-row, workbook, PDF, browser, and hosted tests before release.
