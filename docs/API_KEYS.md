# API Key Handling

Do not paste real API keys into the React UI source code, GitHub Pages, sample files, screenshots, Markdown docs, or commits.

The deployed GitHub Pages app is a static frontend. Anything placed inside React code can be viewed by anyone who opens browser developer tools.

## Was the NVIDIA API Key Added?

No.

The repository was scanned before publishing. No real NVIDIA key was committed to the repo.

## Where to Put Keys Locally

Use a private `.env` file on the machine that runs the backend or PDF generation service.

From the repo root:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
cp .env.example .env
```

Then edit `.env` and paste the key there:

```text
NVIDIA_API_KEY=your_real_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3-ultra-550b-a55b
```

The `.gitignore` file excludes `.env` and `.env.*`, so real keys stay local.

## Temporary Terminal Test

For a one-time local test without writing a file:

```bash
export NVIDIA_API_KEY="your_real_key_here"
```

Then run the backend/report script that needs the key from the same terminal session.

## NVIDIA Connectivity Test

After adding your key to `.env`, run:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
python3 tools/test_nvidia_connectivity.py
```

Expected success output:

```text
SUCCESS: NVIDIA API connectivity test passed.
HTTP status: 200
Model: nvidia/nemotron-3-ultra-550b-a55b
```

If you receive `401 Unauthorized`, the key is wrong, expired, copied with an extra space, or not authorized for the selected NVIDIA model.

## Frontend Connectivity Test Button

The deployed UI has a **Test API Connectivity** button in the AI PDF panel.

That button tests your backend health endpoint, for example:

```text
http://127.0.0.1:8000/health
https://your-internal-mva-api.company.local/health
```

It does not send the NVIDIA key from the browser. The backend must hold the key and expose a safe health endpoint.

## Run the Local API Server for UI Testing

Start this in a separate Terminal window:

```bash
cd "/Users/mohammedshahid/Documents/New project/unified-tool"
./run-local-api.sh
```

The local API server exposes:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/health/nvidia
http://127.0.0.1:8000/generate/pdf
```

Then open the deployed UI:

```text
https://drhayabusa.github.io/unified-tool/
```

Select **NVIDIA NIM**, keep the health URL as:

```text
http://127.0.0.1:8000/health/nvidia
```

Click **Test API Connectivity**.

Expected result:

```text
API status: Connected: 200
```

The **Generate AI PDF Report** button sends a placeholder request to `/generate/pdf`. The production backend should replace this placeholder endpoint with the real PDF generation pipeline.

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
