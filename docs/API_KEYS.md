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
NVIDIA_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
```

The `.gitignore` file excludes `.env` and `.env.*`, so real keys stay local.

## Temporary Terminal Test

For a one-time local test without writing a file:

```bash
export NVIDIA_API_KEY="your_real_key_here"
```

Then run the backend/report script that needs the key from the same terminal session.

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
