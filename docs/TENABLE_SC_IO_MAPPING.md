# Tenable.sc and Tenable.io Field Mapping

This is the first source adapter for MVA Unified Agent.

## Required MVA Output Fields

| MVA Field | Tenable.sc Field | Tenable.io Field |
|---|---|---|
| IP Address | `IP Address` | `asset.display_ipv4_address`, `asset.ipv4_addresses` |
| DNS Name | `DNS Name`, `NetBIOS Name` | `asset.display_fqdn`, `asset.host_name`, `asset.name`, `asset.netbios_name` |
| Vulnerability Name | `Plugin Name` | `definition.name` |
| CVE | `CVE` | `definition.cve` |
| Severity | `Severity`, `Risk Factor` | `definition.severity`, `severity` |
| Exploit Availability | `Exploit?` | `Exploit Ease`, `definition.exploitability_ease`, exploit/malware/KEV indicators |
| Patch Priority | Calculated by MVA | Calculated by MVA |
| Asset Exposure | Calculated by MVA | Calculated by MVA |
| Vulnerability Finding | `Plugin Output` | `output` |
| Summary | `Synopsis` | `definition.synopsis` |
| Description | `Description` | `definition.description` |
| Remediation | `Steps to Remediate` | `definition.solution`, `definition.workaround` |
| KB Links | `See Also`, `Cross References` | `definition.see_also`, `definition.references` |
| Platform Details | `CPE`, `Family`, `Check Type` | `definition.cpe`, `definition.family`, `asset.operating_system` |
| First Discovered | `First Discovered` | `first_observed` |
| Last Observed | `Last Observed` | `last_seen` |

## Exploit Availability Logic

MVA treats exploit availability as `Yes` when a scanner field clearly indicates an exploit, exploit ease, exploit maturity, malware use, KEV presence, Nessus exploitation, or similar exploit signal.

MVA treats exploit availability as `No` when fields are empty, `No`, `False`, `Unproven`, `Not available`, or clearly negative.

## Patch Priority Logic

| Exploit Availability | Critical | High | Medium | Low |
|---|---:|---:|---:|---:|
| Yes / Available | P1 | P1 | P2 | P2 |
| No / Unavailable | P2 | P2 | P3 | P4 |

