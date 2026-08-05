#!/bin/bash
# Post-merge setup — runs automatically after every task merge.
# Idempotent, non-interactive (stdin is closed), fast.
set -e

echo "[post-merge] Installing dependencies..."
npm install --no-audit --no-fund

echo "[post-merge] Verifying TypeScript compiles..."
npx tsc --noEmit

echo "[post-merge] Done."
