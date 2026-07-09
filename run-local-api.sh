#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
python3 tools/mva_api_server.py
