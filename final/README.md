# MVA Unified Agent - Final Handover

Release date: 14 July 2026

## Final Outputs

The `Excel` folder contains one validated dashboard workbook for each supported source:

- Tenable.sc
- Tenable.io
- Qualys
- CrowdStrike

The `PDF` folder contains one customer-ready Remediation Guide for each source. Each guide includes a contents page, report summary, prioritized remediation actions, advisory links, implementation and validation command blocks, and validation expectations.

## Sample Data

The `Sample Data` folder is organized by source and workflow:

- Monthly folders contain April, May, June, and July 2026 CSVs.
- Adhoc folders contain a 100+ row July CSV suitable for immediate analysis.
- CrowdStrike also includes the remediation-per-assets aggregate CSV for weighted-count testing.

## Evidence

- `Screenshots/Excel` contains images rendered directly from the final `.xlsx` worksheets.
- `Screenshots/PDF` contains the cover and a technical remediation page rendered from each final PDF.
- `Validation/Excel` proves workbook reopening, required sheets, formula-error absence, and removal of the obsolete `Lane` field.
- `Validation/PDF` contains the 15-point PDF validation result for each source.
- `Validation/AI/NVIDIA_CONNECTIVITY.md` records the redacted live NVIDIA API test.

No API key is stored anywhere in this handover folder.
