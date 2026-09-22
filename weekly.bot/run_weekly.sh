#!/usr/bin/env bash
# Soft-reset (if week rolled) + scrape Discover + classify genres.
set -euo pipefail

BOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BOT_DIR"

echo "[weekly.bot] $(date -Is) starting weekly run"
python3 main.py
echo "[weekly.bot] classifying…"
python3 main.py --classify
echo "[weekly.bot] $(date -Is) done"
