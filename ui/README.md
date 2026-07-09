# MVA Unified Agent UI Prototype

This is the first high-fidelity UI shell for the MVA Unified Agent.

Run locally:

```bash
cd "/Users/mohammedshahid/Documents/New project/MVA-Unified-Agent"
python3 -m http.server 8700 --directory ui
```

Open:

```text
http://127.0.0.1:8700
```

Prototype behavior:

- Select source tool: Tenable.sc, Tenable.io, MDVM, CrowdStrike, Qualys, Custom CSV
- Update field mapping panel based on selected source
- Show summary date selection
- Show AI Remediation Guide request payload
- Show remediation queue and priority matrix

