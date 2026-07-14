# NVIDIA API Connectivity Evidence

- Test date: 14 July 2026
- Provider base URL: `https://integrate.api.nvidia.com/v1`
- Selected model: `nvidia/nemotron-3-ultra-550b-a55b`
- Chat completions endpoint: `/chat/completions`
- Result: **PASS**
- HTTP status: `200`
- Expected response received: `OK`
- Credential handling: loaded from the local `.env` file for the test only; the key is not copied into this folder, source control, screenshots, logs, or reports.

## Model Selection

Nemotron 3 Ultra 550B-A55B is selected as the quality-first NVIDIA model for MVA remediation-report generation. NVIDIA describes it as its largest Nemotron 3 model, optimized for frontier reasoning, complex agentic workflows, long-context analysis, tool use, and high-stakes retrieval-augmented generation.

Official references:

- https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b/modelcard
- https://docs.nvidia.com/nim/large-language-models/latest/day-0/get-started-nemotron-3-ultra.html
- https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b?nim=hosted
