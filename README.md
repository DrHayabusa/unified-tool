# MVA Unified Agent

MVA Unified Agent is a database-free vulnerability intake and remediation platform. It parses scanner CSV and XLSX exports locally in the browser, normalizes them into one MVA schema, applies the approved exploit-aware priority matrix, produces adhoc or monthly dashboards, exports Excel/CSV reports, and generates a Remediation Guide PDF locally or through an optional AI provider.

## Implemented Sources

- Tenable.sc: adhoc and multi-month comparison.
- Tenable.io: adhoc and multi-month comparison, including native `vuln_age` / `age_in_days` support.
- Qualys VMDR: monthly and adhoc export layouts.
- CrowdStrike Exposure Management:
  - `Vulnerabilities`: adhoc and multi-month comparison.
  - `Vulnerability per asset`: adhoc and multi-month comparison.
  - `Remediation per assets`: weighted adhoc analysis using the source `Count` field.

MDVM and Custom CSV are visibly marked as the next implementation phase instead of presenting non-working navigation.

## Priority Matrix

| Severity | Exploit available | No exploit evidence |
|---|---:|---:|
| Critical | P1 | P2 |
| High | P1 | P2 |
| Medium | P2 | P3 |
| Low | P2 | P4 |

For CrowdStrike detailed exports, exploit availability comes from `Exploit status label`, `Exploit status value`, or `Is CISA KEV`. `ExPRT Rating` remains an enrichment field and is not treated alone as proof that exploit code is available. For the aggregated export, the source `Exploits` value is used.

## Run Locally

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
./run-react-ui.sh
```

Open [http://127.0.0.1:8800/](http://127.0.0.1:8800/).

Manual development commands:

```bash
cd react-ui
npm install
npm run dev -- --host 127.0.0.1 --port 8800
```

## Public Deployment

GitHub Pages is built by `.github/workflows/deploy-pages.yml` from `react-ui/` and published at:

[https://drhayabusa.github.io/unified-tool/](https://drhayabusa.github.io/unified-tool/)

The static site performs CSV/XLSX comparison in the browser. Session-pasted provider keys remain in React state and are cleared when the tab closes. For enterprise production, route AI calls through an organization-controlled backend so keys never reach browser JavaScript.

## AI Provider

The report builder exposes four safe operating paths:

- **OpenRouter - Nemotron 3 Ultra**: direct browser-compatible route using `nvidia/nemotron-3-ultra-550b-a55b:free`. This is the default cloud testing option.
- **Groq - GPT OSS 120B**: fast production OpenAI-compatible route using `openai/gpt-oss-120b`.
- **NVIDIA NIM - MVA Cloud Proxy**: uses `nvidia/nemotron-3-ultra-550b-a55b` through an organization-hosted HTTPS MVA API. NVIDIA Build does not allow this static frontend to call its API directly through browser CORS.
- **Template PDF - No AI**: always-available local generation. No vulnerability data leaves the browser.

Session-pasted keys live only in React memory, clear when providers change or the tab closes, and are never committed or included in reports. For an enterprise rollout, use the MVA Cloud API route so long-lived provider credentials stay server-side.

Official evidence:

- [NVIDIA Nemotron 3 Ultra Build page](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
- [NVIDIA Nemotron 3 Ultra model card](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b/modelcard)
- [NVIDIA model catalog](https://build.nvidia.com/nvidia)
- [OpenRouter API quickstart](https://openrouter.ai/docs/quickstart)
- [Groq supported production models](https://console.groq.com/docs/models)

## Validation

```bash
python3 -m unittest -v tests.test_crowdstrike_and_regressions
python3 tools/run_release_validation.py
node tools/run_browser_80k_validation.mjs
cd react-ui
npm test
npm run build
npm audit --audit-level=moderate
```

The release validators check every supplied CrowdStrike raw column, all export layouts, the priority matrix, monthly movement, SC/IO/Qualys regressions, and 80,000-row performance in both the Python reference engine and the JavaScript engine used by React. Evidence is written to `output/validation/`.

## Outputs And Handover

- Test data and expected values: `SAMPLE_DATA.md`
- CrowdStrike design and field mapping: `docs/CROWDSTRIKE_IMPLEMENTATION.md`
- Complete rebuild handover: `docs/COMPLETE_RECREATE_HANDOVER.md`
- Final production handover: `docs/FINAL_PRODUCTION_HANDOVER.md`
- Architecture and stack: `docs/ARCHITECTURE_AND_STACK.md`
- Final unified Excel sample: `output/excel/mva_unified_final_team_sample.xlsx`
- Final CrowdStrike Excel sample: `output/excel/mva_crowdstrike_final_team_sample.xlsx`
- Final PDF sample: `output/pdf/mva_final_remediation_guide.pdf`
- All supported source samples: `output/sample-packs/MVA_All_Supported_Source_Samples.zip`
- Individual source packs: `output/sample-packs/`

## MVA Report Schema

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
Record Count
```
