# Tenable Field Validation and Dashboard Scope

This document captures the Tenable.sc and Tenable.io fields provided for MVA validation, plus the exact Tenable dashboard outputs currently in scope.

## Tenable.sc Raw Fields

```text
Vulnerability Priority Rating
Exploit Prediction Scoring System (EPSS)
IP Address
Protocol
Port
ACR
AES
Exploit?
Repository
MAC Address
DNS Name
NetBIOS Name
Plugin Output
Synopsis
Description
Steps to Remediate
Risk Factor
STIG Severity
CVSS V2 Base Score
CVSS V3 Base Score
CVSS V4 Base Score
CVSS V2 Temporal Score
CVSS V3 Temporal Score
CVSS V4 Threat Score
CVSS V2 Vector
CVSS V3 Vector
CVSS V4 Vector
CVSS V4 Threat Vector
CVSS V4 Supplemental
CPE
CVE
BID
Cross References
First Discovered
Last Observed
Vuln Publication Date
Security End of Life Date
Patch Publication Date
Plugin Publication Date
Plugin Modification Date
Exploit Ease
Exploit Frameworks
Check Type
Version
Recast Risk Comment
Accept Risk Comment
Agent ID
Host ID
Nessus Web Tests
Thorough Tests
Scan Accuracy
Plugin Name
Family
Plugin
Severity
See Also
```

## Tenable.io Raw Fields

```text
age_in_days
asset.display_fqdn
asset.display_ipv4_address
asset.display_ipv6_address
asset.display_mac_address
asset.host_name
asset.id
asset.ipv4_addresses
asset.ipv6_addresses
asset.last_authenticated_scan_time
asset.last_licensed_scan_time
asset.name
asset.netbios_name
asset.network.id
asset.network.name
asset.operating_system
asset.operating_systems
asset.system_type
asset.tags
asset_inventory
default_account
definition.bugtraq
definition.cpe
definition.cve
definition.cvss2.base_score
definition.cvss2.base_vector
definition.cvss2.temporal_score
definition.cvss2.temporal_vector
definition.cvss3.base_score
definition.cvss3.base_vector
definition.cvss3.temporal_score
definition.cvss3.temporal_vector
definition.cvss4.base_score
definition.cvss4.base_vector
definition.cwe
definition.description
definition.epss.score
definition.exploitability_ease
definition.exploited_by_malware
definition.exploited_by_nessus
definition.family
definition.iava
definition.iavb
definition.iavm
definition.iavt
definition.id
definition.in_the_news
definition.malware
definition.name
definition.patch_published
definition.plugin_published
definition.plugin_updated
definition.plugin_version
definition.references
definition.see_also
definition.severity
definition.solution
definition.stig_severity
definition.synopsis
definition.type
definition.unsupported_by_vendor
definition.vpr.drivers_age_of_vulns_high
definition.vpr.drivers_age_of_vulns_low
definition.vpr.drivers_cvss3_impact_score
definition.vpr.drivers_exploit_code_maturity
definition.vpr.drivers_product_coverage
definition.vpr.drivers_threat_intensity
definition.vpr.drivers_threat_recency_high
definition.vpr.drivers_threat_recency_low
definition.vpr.drivers_threat_sources
definition.vpr.score
definition.vpr_v2.drivers_cve_id
definition.vpr_v2.drivers_exploit_chain
definition.vpr_v2.drivers_exploit_code_maturity
definition.vpr_v2.drivers_exploit_probability
definition.vpr_v2.drivers_in_the_news_intensity_last_30
definition.vpr_v2.drivers_in_the_news_recency
definition.vpr_v2.drivers_in_the_news_sources_last_30
definition.vpr_v2.drivers_malware_observations_intensity_last_30
definition.vpr_v2.drivers_malware_observations_recency
definition.vpr_v2.drivers_on_cisa_kev
definition.vpr_v2.drivers_targeted_industries
definition.vpr_v2.drivers_targeted_regions
definition.vpr_v2.drivers_vpr_percentile
definition.vpr_v2.drivers_vpr_severity
definition.vpr_v2.score
definition.vulnerability_published
definition.workaround
definition.workaround_published
definition.workaround_type
first_observed
id
last_fixed
last_seen
output
port
protocol
recast_reason
resurfaced_date
risk_modified
scan.id
scan.target
severity
software_vulns
source
state
time_to_fix
vuln_age
vuln_sla_date
```

## MVA Normalized Fields in Scope

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
Protocol
Port
Source Tool
Source Vulnerability ID
Finding Key
```

## Priority Matrix

| Exploit Availability | Critical | High | Medium | Low |
|---|---:|---:|---:|---:|
| Yes / Available | P1 | P1 | P2 | P2 |
| No / Unavailable | P2 | P2 | P3 | P4 |

## Monthly Comparison Dashboards in Scope

Only these dashboards are currently in scope:

1. Trend of vulnerabilities discovered in the last 3 months.
2. Total open vulnerabilities: new vulnerabilities plus vulnerabilities not closed from previous months.
3. Total open vulnerabilities segregated by patch priority using the MVA priority matrix.
4. Total open vulnerabilities segregated by age and patch priority: `P1`, `P2`, `P3`, `P4` versus `>7 days`, `>30 days`, `>60 days`, `>180 days (6+ months)`.
5. Total vulnerabilities patched in the last month.

For patched vulnerabilities, the engine uses the positive operational calculation:

```text
Patched last month = Previous month open + New this month - Current month open
```

This is equivalent to:

```text
Patched last month = Findings present in previous month that are no longer present in current month
```

## Monthly Input Approaches

MVA supports two Tenable monthly comparison approaches:

1. Same-source multi-month analysis: upload two or more monthly exports from the same source, such as all Tenable.sc or all Tenable.io.
2. Mixed Tenable migration analysis: upload monthly exports where older months are Tenable.sc and newer months are Tenable.io. The engine normalizes both formats before comparing finding keys.

The CLI supports both explicitly:

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --approach same-source \
  --snapshot "April 2026=samples/tenable_100_row/tenable_sc_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_sc_may_2026_100plus.csv" \
  --output output/dashboard_json/monthly_sc_dashboard.json
```

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --approach same-source \
  --snapshot "April 2026=samples/tenable_100_row/tenable_io_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_io_may_2026_100plus.csv" \
  --output output/dashboard_json/monthly_io_dashboard.json
```

```bash
python3 tools/tenable_dashboard_cli.py monthly \
  --approach mixed-tenable \
  --snapshot "April 2026=samples/tenable_100_row/tenable_sc_april_2026_100plus.csv" \
  --snapshot "May 2026=samples/tenable_100_row/tenable_sc_may_2026_100plus.csv" \
  --snapshot "June 2026=samples/tenable_100_row/tenable_io_june_2026_100plus.csv" \
  --snapshot "July 2026=samples/tenable_100_row/tenable_io_july_2026_100plus.csv" \
  --output output/dashboard_json/monthly_mixed_tenable_dashboard.json
```

## Adhoc Dashboard Scope

Only these Adhoc outputs are currently in scope:

1. Total vulnerabilities.
2. Severity counts.
3. Patch priority counts.
4. Top 10 affected assets by vulnerability count.
