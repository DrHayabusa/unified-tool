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
            self.send_json(
                {
                    "ok": True,
                    "status": "accepted",
                    "message": "PDF generation request accepted by local API placeholder.",
                    "provider": payload.get("provider"),
                    "targetMonth": payload.get("targetMonth"),
                    "note": "Wire this endpoint to the production PDF builder when backend generation is ready.",
                }
            )
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
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format: str, *args) -> None:  # noqa: A002 - BaseHTTPRequestHandler API.
        print(f"{self.address_string()} - {format % args}")


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
