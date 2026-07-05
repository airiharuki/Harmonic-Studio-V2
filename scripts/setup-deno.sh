#!/usr/bin/env bash
# Downloads a yt-dlp-compatible Deno build (2.3.x - 2.6.x) into .bin/deno.
# yt-dlp's EJS challenge solver requires Deno in this range; Nix's pinned
# deno package (2.2.x) is too old and is reported as "unsupported".
set -euo pipefail

DENO_VERSION="2.6.0"
TARGET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.bin"
TARGET_BIN="$TARGET_DIR/deno"

if [ -x "$TARGET_BIN" ]; then
  CURRENT_VERSION="$("$TARGET_BIN" --version | head -1 | awk '{print $2}')"
  if [ "$CURRENT_VERSION" = "$DENO_VERSION" ]; then
    echo "deno $DENO_VERSION already present at $TARGET_BIN"
    exit 0
  fi
fi

mkdir -p "$TARGET_DIR"
TMP_ZIP="$(mktemp -d)/deno.zip"
echo "Downloading deno $DENO_VERSION..."
curl -fsSL -o "$TMP_ZIP" "https://github.com/denoland/deno/releases/download/v${DENO_VERSION}/deno-x86_64-unknown-linux-gnu.zip"
unzip -o "$TMP_ZIP" -d "$TARGET_DIR"
chmod +x "$TARGET_BIN"
rm -rf "$(dirname "$TMP_ZIP")"
echo "Installed deno to $TARGET_BIN"
"$TARGET_BIN" --version
