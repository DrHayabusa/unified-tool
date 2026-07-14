# Unified Release Validation

Status: **PASS**

## Automated checks

- React data-engine, provider, upload, report, security, and PDF suite: 41 of 41 passed.
- Vite production build: passed.
- PDF structure: valid A4 PDF, 12 pages, expected sections present, no `undefined` or `NaN` output.
- Workbook: four populated sheets, two combined trend charts, two monthly discovered/remediated charts, and no formula-error matches.
- Explicit selection: Unified mode starts with no scanners selected and requires at least two.
- Coverage: every selected scanner is required in every monthly comparison period.
- Month selection: the chosen PDF month controls the findings, summary, trend cutoff, local PDF, and NVIDIA prompt.

## Independent raw-CSV pivot

The validator in `tools/validate_unified_release.py` parses all 16 raw scanner exports independently and does not import the React engine. Its results exactly match `engine_analysis.json`.

| Period | Raw observations | Open | New | Patched | Repeats removed | Confirmed | Source-only | Exploit available | P1 | P2 | P3 | P4 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| April 2026 | 410 | 150 | 0 | 0 | 260 | 40 | 110 | 70 | 42 | 62 | 23 | 23 |
| May 2026 | 450 | 160 | 30 | 20 | 290 | 40 | 120 | 74 | 44 | 66 | 24 | 26 |
| June 2026 | 485 | 165 | 25 | 20 | 320 | 40 | 125 | 78 | 44 | 73 | 23 | 25 |
| July 2026 | 495 | 160 | 20 | 25 | 335 | 40 | 120 | 77 | 44 | 69 | 23 | 24 |

The latest age-by-priority matrix also matches exactly at all four cumulative thresholds: greater than 7, 30, 60, and 180 days.
