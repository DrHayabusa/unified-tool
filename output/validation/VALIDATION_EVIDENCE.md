# MVA Unified Agent - Final Validation Evidence

Validated: 2026-07-14

## Release Gate

| Check | Result |
|---|---:|
| Full source, mapping, dashboard, and performance validation | **496 / 496 passed** |
| Python regression tests | **19 / 19 passed** |
| React data-engine and AI-provider tests | **17 / 17 passed** |
| Production React build | **Passed** |
| Dependency audit | **0 vulnerabilities** |
| Python compile check | **Passed** |
| Tracked-secret pattern scan | **Passed - no matches** |

## 80,000-Row Capacity

| Runtime | Rows | Total | Result |
|---|---:|---:|---:|
| Python reference engine | 80,000 | 2.757 seconds | **Passed** |
| Browser/React engine | 80,000 | 1.804 seconds | **Passed** |

The browser test normalized every row, produced a dashboard total of 80,000 findings, and identified 2,000 distinct assets. The Python reference run independently reconciled severity, priority, asset, and dashboard totals.

## Real Browser Workflow

| Interaction | Result |
|---|---:|
| CrowdStrike 4-month bundled pack | April-July detected |
| Analyze monthly report | 120 open, 20 new, 100 not closed, 25 patched |
| Five required dashboard views | **Passed** |
| Browser Excel button | **Generated and downloaded** |
| Browser normalized CSV button | **Generated and downloaded** |
| July Template Remediation Guide button | **Generated and downloaded** |
| OpenRouter direct-cloud network path | Provider reached; deliberate invalid test key returned controlled `401` rather than CORS failure |
| Temporary browser test credential | Cleared after validation |

Release screenshot: `output/validation/screenshots/ui_crowdstrike_monthly_release_final.jpg`.

## Scanner Sample Packs

| Source | Scenario | Files / raw rows | Result |
|---|---|---:|---:|
| Tenable.sc | April-July monthly | 100 / 110 / 120 / 125 | **Passed** |
| Tenable.io | April-July monthly with native vulnerability age | 100 / 110 / 120 / 125 | **Passed** |
| Qualys VMDR | April-July monthly | 100 / 110 / 120 / 125 | **Passed** |
| Qualys VMDR | July adhoc | 125 | **Passed** |
| CrowdStrike Vulnerabilities | April-July monthly | 110 / 130 / 135 / 130 | **Passed** |
| CrowdStrike Vulnerability per asset | July adhoc | 120 | **Passed** |
| CrowdStrike Remediation per assets | Weighted adhoc | 100 rows / 542 findings | **Passed** |

The CrowdStrike monthly pack reconciles July to 120 open, 20 new, 100 not closed, 25 patched, P1 24, P2 59, P3 18, and P4 19. The required discovered trend is 30, 25, 20 and the patched trend is 20, 20, 25.

## Final Excel Workbooks

| Workbook | Sheets | Formula errors | Visual render |
|---|---:|---:|---:|
| `mva_unified_final_team_sample.xlsx` | 3 | 0 | **Passed** |
| `mva_crowdstrike_final_team_sample.xlsx` | 3 | 0 | **Passed** |

Both workbooks contain Executive, Monthly, and Adhoc dashboards. All six sheets were rendered and inspected for overlap, clipping, chart placement, priority colors, and the removal of the obsolete `Lane` field.

## Final PDF

| Validation | Result |
|---|---:|
| File | `output/pdf/mva_final_remediation_guide.pdf` |
| Pages | 11 |
| Semantic checks | **15 / 15 passed** |
| Clickable advisory links | 15 |
| Encryption | None |
| Poppler render | **Passed** |
| PDFium render | **Passed** |

The PDF includes the Remediation Guide cover, contents, report summary, eight prioritized remediation actions, command blocks, validation expectations, and consistent page headers and footers. Open Bitstream Vera fonts are embedded for deterministic cross-platform rendering.

## NVIDIA Cloud Test

The configured NVIDIA Build endpoint returned HTTP 200 from `nvidia/nemotron-3-ultra-550b-a55b` with the expected `OK` response. The key was loaded only from the ignored local `.env`; it is not printed in this evidence and is not tracked by Git.

NVIDIA's endpoint was also confirmed to omit the browser CORS permission required by GitHub Pages. The UI therefore routes native NVIDIA keys through MVA Cloud API and offers OpenRouter's browser-compatible Nemotron Ultra route for direct cloud testing.
