#!/usr/bin/env bash

set -euo pipefail

siteDir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required to render the site." >&2
  exit 1
fi

exec node "$siteDir/static.mjs"
