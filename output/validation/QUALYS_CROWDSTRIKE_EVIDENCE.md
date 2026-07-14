# Qualys and CrowdStrike Validation Evidence

Validation date: 14 July 2026  
Public agent: https://drhayabusa.github.io/unified-tool/  
Release repository: https://github.com/DrHayabusa/unified-tool

This evidence was captured from the deployed GitHub Pages application using the bundled synthetic test exports. CSV parsing, normalization, priority scoring, dashboard calculations, Excel generation, and normalized CSV generation ran in the browser.

## Qualys VMDR

### Monthly comparison

Uploaded reports: April 2026, May 2026, June 2026, July 2026.

| Month | Critical | High | Medium | Low | Total Open | New | Patched |
|---|---:|---:|---:|---:|---:|---:|---:|
| April 2026 | 25 | 25 | 25 | 25 | 100 | 0 | 0 |
| May 2026 | 28 | 28 | 27 | 27 | 110 | 30 | 20 |
| June 2026 | 30 | 30 | 30 | 30 | 120 | 40 | 30 |
| July 2026 | 31 | 31 | 31 | 32 | 125 | 30 | 25 |

Latest-month results:

- Total open: 125.
- New: 30.
- Not closed: 95.
- Patched since June: 25.
- Immediate patch needed (P1 + P2): 72.
- Required dashboards rendered: discovered trend, total open, priority distribution, age by priority, and patched trend.
- Excel report: generated and downloaded.
- Normalized CSV: generated and downloaded.
- July Remediation Guide PDF using the local template route: generated and downloaded.
- Final Qualys Excel evidence: `Monthly Report` and `Report Data` sheets, 125 normalized rows, no formula errors, and no obsolete `Lane` field.
- Final industry-format Qualys Remediation Guide: 13 pages, 11 clickable links, and 15 of 15 validation checks passed.

### Adhoc analysis

- Input: `qualys_adhoc_july_2026_100plus.csv`.
- Detected source: Qualys Adhoc.
- Total open: 125.
- Distinct affected assets: 40.
- Critical: 31.
- High: 31.
- Medium: 31.
- Low: 32.
- Immediate patch needed (P1 + P2): 72.
- Top 10 affected assets, mapped fields, priority matrix, and remediation queue rendered.

## CrowdStrike Exposure Management

### Monthly comparison

Uploaded reports: April 2026, May 2026, June 2026, July 2026.

| Month | Critical | High | Medium | Low | Total Open | New | Patched |
|---|---:|---:|---:|---:|---:|---:|---:|
| April 2026 | 28 | 28 | 27 | 27 | 110 | 0 | 0 |
| May 2026 | 30 | 30 | 30 | 30 | 120 | 30 | 20 |
| June 2026 | 32 | 31 | 31 | 31 | 125 | 25 | 20 |
| July 2026 | 30 | 30 | 30 | 30 | 120 | 20 | 25 |

Latest-month results:

- Total open: 120.
- New: 20.
- Not closed: 100.
- Patched since June: 25.
- Immediate patch needed (P1 + P2): 83.
- Exploit available: 47.
- CISA KEV: 11.
- Internet exposed: 24.
- Critical assets: 12.
- Excel report: generated and downloaded.
- Normalized CSV: generated and downloaded.
- July Remediation Guide PDF using the local template route: generated and downloaded.

### Adhoc analysis

- Input: `crowdstrike_vulnerability_per_asset_july_2026_100plus.csv`.
- Detected source: CrowdStrike Vulnerabilities.
- Total open: 120.
- Distinct affected assets: 45.
- Critical: 30.
- High: 30.
- Medium: 30.
- Low: 30.
- Immediate patch needed (P1 + P2): 83.
- Exploit available: 47.
- CISA KEV: 11.
- Internet exposed: 24.
- Top 10 affected assets, mapped fields, priority matrix, and remediation queue rendered.

## Release Checks

- Public agent returned HTTP 200.
- Public sample CSV endpoints returned HTTP 200.
- Hosted Qualys monthly browser console errors and warnings: none.
- Hosted Qualys adhoc browser console errors and warnings: none.
- Hosted CrowdStrike monthly browser console errors and warnings: none.
- Hosted CrowdStrike adhoc browser console errors and warnings: none.
- Full regression validation: 496 of 496 checks passed.
- Python 80,000-row validation: passed in 2.757 seconds.
- Browser 80,000-row validation: passed in 1.804 seconds.
- Final CrowdStrike workbook: required sheets present, no formula errors, and no obsolete `Lane` field.
- Final Remediation Guide: 11 pages, 15 clickable links, 15 of 15 checks passed, eight unique remediation actions, and no encryption.
- Final Qualys workbook: required sheets present, no formula errors, and no obsolete `Lane` field.
- Final Qualys Remediation Guide: 13 pages, 11 clickable links, 15 of 15 checks passed, and no encryption.

## Screenshot Evidence

- `output/validation/screenshots/ui_hosted_qualys_monthly_top.png`
- `output/validation/screenshots/ui_hosted_qualys_monthly_final.png`
- `output/validation/screenshots/ui_hosted_qualys_adhoc_final.png`
- `output/validation/screenshots/ui_hosted_crowdstrike_dashboard_view.png`
- `output/validation/screenshots/ui_hosted_crowdstrike_adhoc_final.png`
- `output/validation/screenshots/pdf_final_remediation_cover.png`
- `output/validation/screenshots/pdf_final_remediation_action.png`
- `output/validation/screenshots/pdf_qualys_remediation_cover.png`
- `output/validation/screenshots/pdf_qualys_remediation_action.png`

All sample exports are synthetic and contain no customer vulnerability data or API credentials.
