#!/usr/bin/env bash
# Install comment-hygiene into opencode's auto-load plugin dir. Re-run to
# update; rm -rf the target dir to uninstall.
set -euo pipefail
src="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
dst="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/plugins/comment-hygiene"
mkdir -p "$dst"
cp "$src"/index.ts "$src"/detect.ts "$dst/"
echo "comment-hygiene installed to $dst (auto-loads in every opencode session, sandboxes included)"
