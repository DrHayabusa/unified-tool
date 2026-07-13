# API Key Handling

This repository contains no real provider key. Never commit a key to React source, GitHub Pages, sample data, screenshots, Markdown, or Git history.

## Supported Paths

| UI option | Key type | Browser behavior | Production recommendation |
|---|---|---|---|
| OpenRouter - Nemotron 3 Ultra | OpenRouter key | Calls `https://openrouter.ai/api/v1/chat/completions` directly | Use for controlled session testing; proxy for managed enterprise use |
| Groq - GPT OSS 120B | Groq key | Calls `https://api.groq.com/openai/v1/chat/completions` directly | Use for controlled session testing; proxy for managed enterprise use |
| NVIDIA NIM - MVA Cloud Proxy | NVIDIA key | Sends the request to a deployed MVA Cloud API, which calls NVIDIA | Recommended NVIDIA architecture |
| MVA Cloud API | Optional MVA bearer token | Calls the organization-hosted `/health` and `/generate/pdf` routes | Recommended enterprise architecture |
| Template PDF - No AI | No key | Generates the approved PDF locally | Safe offline fallback |

NVIDIA Build's API works from a server but does not expose the browser CORS headers required by a static GitHub Pages application. Do not paste `https://integrate.api.nvidia.com/v1` into the **MVA Cloud API URL** field. That field requires the public HTTPS URL of an MVA proxy.

## Generate Keys

- OpenRouter: `https://openrouter.ai/settings/keys`
- Groq: `https://console.groq.com/keys`
- NVIDIA Build: `https://build.nvidia.com/settings/api-keys`

The same links are available inside the AI Report Builder.

## Session-Only Fields

The React UI exposes:

```text
API Key
Provider Base URL or MVA Cloud API URL
Model Route
```

Session guarantees:

1. The value is held in React component state only.
2. The value is not written to `localStorage`, `sessionStorage`, IndexedDB, cookies, reports, or sample files.
3. Switching providers clears the previous key to prevent cross-provider credential leakage.
4. Refreshing or closing the tab clears the value.
5. Direct-provider keys are placed only in the `Authorization` header, never in the JSON request body.
6. The browser sends data only after the user clicks **Test Provider** or **Generate PDF Report**.

## Local Environment

The ignored `.env` file may hold development-only server settings:

```text
NVIDIA_API_KEY=<private key>
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3-ultra-550b-a55b
GROQ_API_KEY=<optional key>
OPENROUTER_API_KEY=<optional key>
```

Run the NVIDIA server-to-server validation without exposing the key:

```bash
python3 tools/test_nvidia_connectivity.py
```

## MVA Cloud API Contract

The prototype is `tools/mva_api_server.py`. A production deployment must be placed behind HTTPS and organizational authentication.

Routes:

```text
GET  /health
POST /health/nvidia
POST /generate/pdf
```

NVIDIA connectivity body:

```json
{
  "apiKey": "session-only override or omit when server environment is configured",
  "baseUrl": "https://integrate.api.nvidia.com/v1",
  "model": "nvidia/nemotron-3-ultra-550b-a55b"
}
```

Production controls:

1. Store provider keys in the cloud secret manager or backend environment.
2. Do not accept provider keys from arbitrary public clients after rollout.
3. Allow CORS only from the approved MVA frontend origin.
4. Authenticate users and authorize report generation.
5. Apply request-size, rate, token, and timeout limits.
6. Redact vulnerability content and credentials from application logs.
7. Allow outbound HTTPS only to approved AI provider hosts.
8. Rotate every key previously pasted into a public chat or screenshot.

## Error Meaning

| Status | Meaning | Action |
|---|---|---|
| `401` | Missing, expired, incomplete, or invalid key | Generate a fresh key and paste the complete value |
| `402` | Provider account lacks credit | Add credit or choose a free model route |
| `403` | Key lacks model permission or policy blocked the request | Verify model access and provider controls |
| `429` | Trial or account rate limit reached | Wait, retry, or choose another provider |
| `502/503` | Selected model/provider temporarily unavailable | Retry or use another provider or Template PDF |
| Browser could not reach endpoint | URL, VPN, CORS, TLS, or deployment issue | Verify the HTTPS URL and server CORS policy |

## Secret Scan

Before every public push:

```bash
git grep -nE 'nvapi-|gsk_|sk-or-v1-|NVIDIA_API_KEY=[^<]|GROQ_API_KEY=[^<]|OPENROUTER_API_KEY=[^<]'
```

No output is the expected result.
