# MVA Unified Multi-Tool Release

This release combines explicitly selected Tenable.sc, Tenable.io, Qualys, and CrowdStrike exports. It never auto-selects scanners and requires every selected scanner to be present in each comparison period.

## Final outputs

- `Excel/MVA_Unified_Combined_Monthly_Report.xlsx`: combined dashboard, monthly report, normalized findings, and source audit.
- `PDF/MVA_Unified_July_2026_Remediation_Guide.pdf`: customer-ready remediation guide for the selected month.
- `MVA_Unified_July_2026_Normalized_Findings.csv`: consolidated July findings with source provenance.
- `Evidence/`: UI, workbook, and PDF screenshots used for visual QA.
- `Validation/`: independent pivot and application-engine evidence.

## Correlation rule

Repeated observations are consolidated only when the asset identity, vulnerability identity, and service identity match. Different vulnerabilities on the same asset remain separate. `Cross-scanner confirmed` means the same consolidated finding was observed by at least two selected scanners; it is not a false-positive guarantee.

## Validated July result

- 160 consolidated open findings across 85 assets.
- 20 new and 25 patched since June.
- 44 P1, 69 P2, 23 P3, and 24 P4 findings.
- 77 findings with exploit availability and 113 requiring immediate patching (P1 + P2).
- 40 cross-scanner confirmed and 120 single-source findings.

See `Validation/RELEASE_VALIDATION.md` for the release gate and independent cross-check.
