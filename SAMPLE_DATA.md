# Sample Data for Testing

This repository includes ready-to-upload scanner exports and generated reference outputs for validating the MVA Unified Agent workflow.

## Downloadable Packs

```text
output/sample-packs/MVA_All_Supported_Source_Samples.zip
output/sample-packs/MVA_Tenable_SC_IO_4_Month_Samples.zip
output/sample-packs/MVA_Qualys_Samples.zip
output/sample-packs/MVA_CrowdStrike_Samples.zip
```

Every archive passes `unzip -t`. The all-sources pack contains every 100+ row Tenable.sc, Tenable.io, Qualys, and CrowdStrike scenario below.

## Tenable.sc Monthly Comparison

Upload these four files together when testing same-source Tenable.sc month-over-month dashboards:

```text
samples/tenable_100_row/tenable_sc_april_2026_100plus.csv
samples/tenable_100_row/tenable_sc_may_2026_100plus.csv
samples/tenable_100_row/tenable_sc_june_2026_100plus.csv
samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
```

Expected final-month dashboard profile:

```text
Total open: 125
New this month: 30
Remediated last month: 25
Patch priority split: P1 41, P2 31, P3 26, P4 27
```

Reference workbook:

```text
output/excel/tenable_sc_multimonth_dashboard_sample.xlsx
```

## Tenable.io Monthly Comparison

Upload these four files together when testing same-source Tenable.io dashboards. The normalizer uses the native `vuln_age` / `age_in_days` fields when present.

```text
samples/tenable_100_row/tenable_io_april_2026_100plus.csv
samples/tenable_100_row/tenable_io_may_2026_100plus.csv
samples/tenable_100_row/tenable_io_june_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
```

Reference workbook:

```text
output/excel/tenable_io_multimonth_dashboard_sample.xlsx
```

## Mixed Tenable SC to IO Migration Comparison

Use this set when testing the migration flow where earlier months came from Tenable.sc and later months came from Tenable.io:

```text
samples/tenable_100_row/tenable_sc_april_2026_100plus.csv
samples/tenable_100_row/tenable_sc_may_2026_100plus.csv
samples/tenable_100_row/tenable_io_june_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
```

Reference workbook:

```text
output/excel/tenable_mixed_sc_io_dashboard_sample.xlsx
```

## Qualys Monthly Comparison

Upload these four files together when testing Qualys month-over-month dashboards:

```text
samples/qualys_100_row/qualys_monthly_april_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_may_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_june_2026_100plus.csv
samples/qualys_100_row/qualys_monthly_july_2026_100plus.csv
```

Reference workbook:

```text
output/excel/qualys_100plus_dashboard_sample.xlsx
```

## CrowdStrike Monthly Comparison

Upload these four detailed exports together. They include every raw field supplied for the CrowdStrike `Vulnerabilities` / `Vulnerability per asset` layout.

```text
samples/crowdstrike_100_row/crowdstrike_vulnerabilities_april_2026_100plus.csv
samples/crowdstrike_100_row/crowdstrike_vulnerabilities_may_2026_100plus.csv
samples/crowdstrike_100_row/crowdstrike_vulnerabilities_june_2026_100plus.csv
samples/crowdstrike_100_row/crowdstrike_vulnerabilities_july_2026_100plus.csv
```

Expected movement:

```text
April open: 110
May open/new/patched: 120 / 30 / 20
June open/new/patched: 125 / 25 / 20
July open/new/patched: 120 / 20 / 25
Three-month discovered trend: 30, 25, 20
Three-month patched trend: 20, 20, 25
July patch priority: P1 24, P2 59, P3 18, P4 19
July exploit available: 47
July CISA KEV: 11
July internet exposed: 24
```

Use this detailed alternative to validate the `Vulnerability per asset` selection:

```text
samples/crowdstrike_100_row/crowdstrike_vulnerability_per_asset_july_2026_100plus.csv
```

Use this aggregated export in Adhoc Scan only. The 100 CSV rows represent 542 weighted findings through the source `Count` field.

```text
samples/crowdstrike_100_row/crowdstrike_remediation_per_assets_july_2026_100plus.csv
```

Final references:

```text
output/excel/mva_crowdstrike_final_team_sample.xlsx
output/pdf/mva_final_remediation_guide.pdf
```

## Adhoc Testing

Use these for single-upload adhoc dashboard testing:

```text
samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
samples/qualys_100_row/qualys_adhoc_july_2026_100plus.csv
samples/crowdstrike_100_row/crowdstrike_vulnerability_per_asset_july_2026_100plus.csv
samples/crowdstrike_100_row/crowdstrike_remediation_per_assets_july_2026_100plus.csv
```

## PDF Reference Output

The current industry-style remediation guide sample is:

```text
output/pdf/mva_final_remediation_guide.pdf
```

## CLI Validation Commands

Run these from the repository root:

```bash
python3 tools/tenable_dashboard_cli.py \
  monthly \
  --approach same-source \
  --snapshot "April 2026=samples/tenable_100_row/tenable_sc_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_sc_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_sc_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_sc_july_2026_100plus.csv"
```

```bash
python3 tools/tenable_dashboard_cli.py \
  monthly \
  --approach same-source \
  --snapshot "April 2026=samples/tenable_100_row/tenable_io_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_io_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_io_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_io_july_2026_100plus.csv"
```

```bash
python3 tools/tenable_dashboard_cli.py \
  monthly \
  --approach mixed-tenable \
  --snapshot "April 2026=samples/tenable_100_row/tenable_sc_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_sc_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_io_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_io_july_2026_100plus.csv"
```
