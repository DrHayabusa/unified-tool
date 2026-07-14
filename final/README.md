# MVA Unified Agent - Final Handover

Release date: 14 July 2026

## Final Outputs

The `Excel` folder contains one validated dashboard workbook for each supported source:

- Tenable.sc
- Tenable.io
- Qualys
- CrowdStrike

Every workbook now uses the same three-sheet structure: `Executive Dashboard`, `Monthly Dashboard`, and `Adhoc Dashboard`. Both Executive and Monthly dashboards contain the required `Vulnerabilities Discovered` and `Vulnerabilities Remediated` line charts. Adhoc uses the appropriate single-snapshot asset and count visuals instead of inventing a time series.

The `PDF` folder contains one customer-ready Remediation Guide for each source. Each guide includes a contents page, report summary, prioritized remediation actions, advisory links, implementation and validation command blocks, and validation expectations.

## Sample Data

The `Sample Data` folder is organized by source and workflow:

- Monthly folders contain April, May, June, and July 2026 CSVs.
- Adhoc folders contain a 100+ row July CSV suitable for immediate analysis.
- CrowdStrike also includes the remediation-per-assets aggregate CSV for weighted-count testing.

Recommended CrowdStrike filenames are `crowdstrike_vulnerabilities_july_2026.csv`, `crowdstrike_vulnerability_per_asset_july_2026.csv`, and `crowdstrike_remediation_per_assets_july_2026.csv`. Keep `month_year` in every monthly filename so ordering is deterministic.

## Evidence

- `Screenshots/Excel` contains images rendered directly from the final `.xlsx` worksheets.
- `Screenshots/PDF` contains the cover and a technical remediation page rendered from each final PDF.
- `Validation/Excel` proves workbook reopening, required sheets, formula-error absence, and removal of the obsolete `Lane` field.
- `Validation/Excel` also inventories every chart and fails if either required trend line is missing from an Executive or Monthly dashboard.
- `Validation/PDF` contains the 15-point PDF validation result for each source.
- `Validation/AI/NVIDIA_CONNECTIVITY.md` records the redacted live NVIDIA API test.

No API key is stored anywhere in this handover folder.

## Application Workflow Included In This Release

- Monthly CSV/XLSX files accumulate across separate drops or browse actions.
- Matching filenames replace their earlier copy; other selected files remain intact.
- Every selected monthly file can be removed individually, and the complete list can be cleared.
- `Edit Monthly Files` returns from results without losing the selected files; `Dashboard` returns to source and mode selection.
- CrowdStrike export-type guidance is present in Adhoc and Monthly workflows, including filename examples and the Adhoc-only restriction for Remediation per assets.
- Adhoc results provide both Excel and normalized CSV downloads.
- Browser-generated Monthly Excel reports embed Discovered and Remediated line-chart images.
- CSV and modern XLSX inputs share the same local normalization engine. Legacy XLS must be saved as XLSX or CSV first.
