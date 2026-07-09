#!/usr/bin/env python3
"""Test NVIDIA NIM / Build API connectivity without exposing keys in the frontend."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b"


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def post_chat_completion(base_url: str, api_key: str, model: str, timeout: int) -> dict:
    endpoint = f"{base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Reply with OK only."}],
        "temperature": 0,
        "max_tokens": 16,
        "stream": False,
    }

    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read().decode("utf-8")
        return {
            "status": response.status,
            "body": json.loads(body),
        }


def main() -> int:
    parser = argparse.ArgumentParser(description="Test NVIDIA NIM API connectivity.")
    parser.add_argument("--env-file", default=".env", help="Path to local .env file")
    parser.add_argument("--base-url", default=None, help="Override NVIDIA base URL")
    parser.add_argument("--model", default=None, help="Override NVIDIA model")
    parser.add_argument("--timeout", type=int, default=30, help="Request timeout in seconds")
    args = parser.parse_args()

    load_dotenv(Path(args.env_file))

    api_key = os.getenv("NVIDIA_API_KEY", "").strip()
    base_url = args.base_url or os.getenv("NVIDIA_BASE_URL", DEFAULT_BASE_URL)
    model = args.model or os.getenv("NVIDIA_MODEL", DEFAULT_MODEL)

    if not api_key or api_key == "replace_with_your_nvidia_key":
        print("ERROR: NVIDIA_API_KEY is not set. Add it to .env or export it in your shell.", file=sys.stderr)
        return 2

    try:
        result = post_chat_completion(base_url=base_url, api_key=api_key, model=model, timeout=args.timeout)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        print(f"ERROR: NVIDIA API returned HTTP {error.code}", file=sys.stderr)
        print(detail[:1200], file=sys.stderr)
        return 1
    except Exception as error:  # noqa: BLE001 - command-line diagnostic should show concise failure.
        print(f"ERROR: Could not connect to NVIDIA API: {error}", file=sys.stderr)
        return 1

    message = result["body"].get("choices", [{}])[0].get("message", {})
    content = message.get("content", "")
    print("SUCCESS: NVIDIA API connectivity test passed.")
    print(f"HTTP status: {result['status']}")
    print(f"Model: {model}")
    print(f"Response: {content.strip() or '[empty response]'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
