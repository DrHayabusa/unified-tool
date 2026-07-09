# Sample Data for Testing

This repository includes ready-to-upload scanner exports and generated reference outputs for validating the MVA Unified Agent workflow.

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

## Adhoc Testing

Use these for single-upload adhoc dashboard testing:

```text
samples/tenable_100_row/tenable_sc_july_2026_100plus.csv
samples/tenable_100_row/tenable_io_july_2026_100plus.csv
samples/qualys_100_row/qualys_adhoc_july_2026_100plus.csv
```

## PDF Reference Output

The current industry-style remediation guide sample is:

```text
output/pdf/mva_100plus_remediation_guide.pdf
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
