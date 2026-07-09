# API Key Handling

Do not paste real API keys into the React UI source code, GitHub Pages, sample files, screenshots, Markdown docs, or commits.

The deployed GitHub Pages app is a static frontend. Anything placed inside React code can be viewed by anyone who opens browser developer tools.

## Was the NVIDIA API Key Added?

No.

The repository was scanned before publishing. No real NVIDIA key was committed to the repo.

## Where to Put Keys

For production, put the NVIDIA key on the cloud backend that generates the PDF.

Example backend environment:

```text
NVIDIA_API_KEY=<your key>
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3-ultra-550b-a55b
```

If you receive `401 Unauthorized`, the key is wrong, expired, copied with an extra space, or not authorized for the selected NVIDIA model.

## Frontend Connectivity Test Button

The deployed UI has a **Test API Connectivity** button in the AI PDF panel.

That button tests your backend health endpoint, for example:

```text
https://your-mva-api.example.com/health/nvidia
```

It does not send the NVIDIA key from the browser. The backend must hold the key and expose a safe health endpoint.

## Session-Only Paste Option in the UI

The AI PDF panel also includes:

```text
API Key (session only)
Provider Base URL
Model
```

Use this for quick testing from the browser session.

Example NVIDIA values:

```text
Provider Base URL: https://integrate.api.nvidia.com/v1
Model: nvidia/nemotron-3-ultra-550b-a55b
```

Important behavior:

```text
The key is not committed to GitHub.
The key is not stored in localStorage.
The key is not saved by the app.
The key stays in the browser memory until the page is refreshed.
When you click Test API Connectivity, the key is sent to the configured backend health endpoint.
When you click Generate AI PDF Report with NVIDIA selected, the key is sent to the configured backend generate endpoint.
```

For production, do not rely on browser-pasted keys. Store keys on the backend.

## Cloud API URL to Paste in the UI

Use your deployed MVA backend URL:

```text
https://your-mva-api.example.com/health/nvidia
```

The **Generate AI PDF Report** button sends a request to `/generate/pdf`.

When **NVIDIA NIM** is selected, or when the provider/model/base URL identifies NVIDIA, the backend:

```text
1. Loads the Remediation Guide prompt contract from docs/AI_PDF_GENERATION_PROMPT.md.
2. Adds the selected tool source, target month, dashboard summary, and normalized rows.
3. Sends that strict prompt to NVIDIA.
4. Receives Remediation Guide Markdown from NVIDIA.
5. Returns the generated Markdown to the UI/API caller.
```

The production backend should then render that Markdown into the approved PDF layout.

## Production Pattern

For production, use this pattern:

```text
React UI -> internal backend/API server -> NVIDIA/Groq/OpenRouter/local AI server
```

Do not use this pattern:

```text
React UI -> NVIDIA/Groq/OpenRouter directly with API key in browser
```

Reason:

```text
Browser-side keys are public keys. Anyone can extract them.
```

## GitHub Pages Limitation

GitHub Pages only serves static files. It cannot safely store or call private API keys by itself.

To make the AI PDF generation live for the team, deploy a backend service internally and store the API key as an environment variable on that server.

Example backend environment:

```text
NVIDIA_API_KEY=...
LOCAL_AI_SERVER_API_KEY=...
```

The React app should call only your backend endpoint, for example:

```text
POST https://your-internal-mva-server.company.local/api/generate-remediation-guide
```

The backend then calls NVIDIA or the selected AI provider.
