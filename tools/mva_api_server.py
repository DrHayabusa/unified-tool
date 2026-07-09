#!/usr/bin/env python3
"""Small local MVA API server for UI connectivity and NVIDIA health tests.

This server is intentionally dependency-free so it can run on a Mac with the
standard Python install. It reads private keys from `.env`; do not put keys in
the React frontend.
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from test_nvidia_connectivity import DEFAULT_BASE_URL, DEFAULT_MODEL, load_dotenv, post_chat_completion
import os


HOST = "127.0.0.1"
PORT = 8000
ROOT = Path(__file__).resolve().parents[1]
PROMPT_CONTRACT_PATH = ROOT / "docs" / "AI_PDF_GENERATION_PROMPT.md"


class MvaApiHandler(BaseHTTPRequestHandler):
    server_version = "MVAApi/0.1"

    def do_OPTIONS(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API.
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API.
        path = urlparse(self.path).path.rstrip("/") or "/"

        if path == "/health":
            self.send_json(
                {
                    "ok": True,
                    "service": "mva-local-api",
                    "message": "MVA local API server is running.",
                }
            )
            return

        if path == "/health/nvidia":
            self.handle_nvidia_health()
            return

        self.send_json({"ok": False, "error": "Not found"}, status=404)

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API.
        path = urlparse(self.path).path.rstrip("/") or "/"
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw_body = self.rfile.read(length) if length else b"{}"

        try:
            payload = json.loads(raw_body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self.send_json({"ok": False, "error": "Invalid JSON body"}, status=400)
            return

        if path == "/generate/pdf":
            self.handle_pdf_generation(payload)
            return

        if path == "/health/nvidia":
            self.handle_nvidia_health(payload)
            return

        self.send_json({"ok": False, "error": "Not found"}, status=404)

    def handle_nvidia_health(self, payload: dict | None = None) -> None:
        payload = payload or {}
        api_key = (payload.get("apiKey") or os.getenv("NVIDIA_API_KEY", "")).strip()
        base_url = (payload.get("baseUrl") or os.getenv("NVIDIA_BASE_URL", DEFAULT_BASE_URL)).strip()
        model = (payload.get("model") or os.getenv("NVIDIA_MODEL", DEFAULT_MODEL)).strip()

        if not api_key or api_key == "replace_with_your_nvidia_key":
            self.send_json(
                {
                    "ok": False,
                    "provider": "NVIDIA NIM",
                    "error": "NVIDIA_API_KEY is not configured in .env.",
                },
                status=503,
            )
            return

        try:
            result = post_chat_completion(base_url=base_url, api_key=api_key, model=model, timeout=30)
            message = result["body"].get("choices", [{}])[0].get("message", {})
            self.send_json(
                {
                    "ok": True,
                    "provider": "NVIDIA NIM",
                    "status": result["status"],
                    "model": model,
                    "response": (message.get("content") or "").strip(),
                }
            )
        except Exception as error:  # noqa: BLE001 - health route should return concise diagnostics.
            self.send_json(
                {
                    "ok": False,
                    "provider": "NVIDIA NIM",
                    "model": model,
                    "error": str(error),
                },
                status=502,
            )

    def handle_pdf_generation(self, payload: dict) -> None:
        provider = str(payload.get("provider") or "Template Only").strip()
        target_month = str(payload.get("targetMonth") or "Not provided").strip()
        provider_is_nvidia = "nvidia" in provider.lower()
        base_url = (
            payload.get("baseUrl")
            or (os.getenv("NVIDIA_BASE_URL", DEFAULT_BASE_URL) if provider_is_nvidia else "")
        ).strip()
        model = (
            payload.get("model")
            or (os.getenv("NVIDIA_MODEL", DEFAULT_MODEL) if provider_is_nvidia else "")
        ).strip()
        api_key = (payload.get("apiKey") or os.getenv("NVIDIA_API_KEY", "")).strip()
        prompt = build_pdf_generation_prompt(payload)

        if not should_call_nvidia(provider=provider, base_url=base_url, model=model):
            self.send_json(
                {
                    "ok": True,
                    "status": "accepted",
                    "message": f"PDF generation request accepted for {target_month}.",
                    "provider": provider,
                    "targetMonth": target_month,
                    "format": "Remediation Guide",
                    "promptPreview": prompt[:1200],
                    "note": "Non-NVIDIA providers should use this same prompt contract in the production backend.",
                }
            )
            return

        if not api_key or api_key == "replace_with_your_nvidia_key":
            self.send_json(
                {
                    "ok": False,
                    "provider": "NVIDIA NIM",
                    "model": model,
                    "targetMonth": target_month,
                    "error": "NVIDIA_API_KEY is not configured. Paste it in the session-only UI field or set it in local .env.",
                },
                status=503,
            )
            return

        try:
            result = post_chat_completion(
                base_url=base_url,
                api_key=api_key,
                model=model,
                timeout=120,
                temperature=0.2,
                max_tokens=4096,
                messages=[
                    {
                        "role": "system",
                        "content": "You are the MVA Remediation Guide generation engine. Return clean Markdown only.",
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
            )
            message = result["body"].get("choices", [{}])[0].get("message", {})
            ai_markdown = (message.get("content") or "").strip()
            self.send_json(
                {
                    "ok": True,
                    "status": "generated",
                    "message": f"NVIDIA generated Remediation Guide Markdown for {target_month}.",
                    "provider": "NVIDIA NIM",
                    "model": model,
                    "targetMonth": target_month,
                    "format": "Remediation Guide",
                    "aiMarkdown": ai_markdown,
                    "note": "Production backend should render aiMarkdown into the approved PDF layout.",
                }
            )
        except Exception as error:  # noqa: BLE001 - API route returns concise diagnostics.
            self.send_json(
                {
                    "ok": False,
                    "provider": "NVIDIA NIM",
                    "model": model,
                    "targetMonth": target_month,
                    "error": str(error),
                },
                status=502,
            )

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        # Required when the GitHub Pages HTTPS frontend calls this localhost API.
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Max-Age", "600")

    def log_message(self, format: str, *args) -> None:  # noqa: A002 - BaseHTTPRequestHandler API.
        print(f"{self.address_string()} - {format % args}")


def should_call_nvidia(provider: str, base_url: str, model: str) -> bool:
    provider_text = provider.lower()
    base_url_text = base_url.lower()
    model_text = model.lower()
    if "template" in provider_text:
        return False
    return (
        "nvidia" in provider_text
        or "integrate.api.nvidia.com" in base_url_text
        or model_text.startswith("nvidia/")
    )


def build_pdf_generation_prompt(payload: dict) -> str:
    target_month = payload.get("targetMonth") or "Not provided"
    source_tool = payload.get("sourceTool") or payload.get("toolSource") or payload.get("providerSource") or "Selected source from MVA UI"
    workflow = payload.get("workflow") or "monthly"
    normalized_rows = payload.get("normalizedRows") or payload.get("findings") or []
    dashboard_summary = payload.get("dashboardSummary") or {}
    prompt_contract = load_prompt_contract()

    return f"""Use the following MVA Remediation Guide PDF contract exactly.

{prompt_contract}

Current request context:
- Report Name: Remediation Guide
- Report Type: Remediation
- Tool Source: {source_tool}
- Reporting Date / Month: {target_month}
- Workflow: {workflow}
- Output required from you: Markdown only, ready for the backend PDF renderer.

Formatting requirements for the PDF renderer:
- The final PDF title must be "Remediation Guide".
- Include a clean Contents section.
- Do not include customer name.
- Do not include "created by".
- Do not say "prepared from normalized KB links" or similar internal wording.
- Use professional customer-facing language.
- Each vulnerability section must include affected asset, CVE, reference links, remediation steps, commands, and validation.
- Commands must be inside fenced code blocks with a language tag such as bash, powershell, or sql.
- If exact commands are not supported by the provided data, write safe generic validation commands and clearly mark placeholders.

Dashboard summary from MVA:
{json.dumps(dashboard_summary, indent=2)}

Normalized vulnerability rows from MVA:
{json.dumps(normalized_rows[:50], indent=2)}

If fewer rows are provided, generate the guide from the available rows only.
If no rows are provided, return the Remediation Guide structure with clear placeholders and state that normalized findings were not provided.
"""


def load_prompt_contract() -> str:
    if PROMPT_CONTRACT_PATH.exists():
        return PROMPT_CONTRACT_PATH.read_text(encoding="utf-8")
    return """# Remediation Guide

## Contents

| Field | Value |
|---|---|
| Report Type | Remediation |
| Tool Source | <selected tool source from the agent> |
| Reporting Date | <selected reporting date> |
| Document Type | Remediation Guide |

## 1. Executive Overview
## 2. Remediation Method
## 3. Remediation Actions
## 4. Validation Requirements
## 5. Reference Appendix
"""


def main() -> int:
    load_dotenv(ROOT / ".env")
    server = ThreadingHTTPServer((HOST, PORT), MvaApiHandler)
    print(f"MVA local API server running at http://{HOST}:{PORT}")
    print("Health endpoints:")
    print(f"  http://{HOST}:{PORT}/health")
    print(f"  http://{HOST}:{PORT}/health/nvidia")
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
