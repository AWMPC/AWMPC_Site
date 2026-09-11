#!/usr/bin/env bash

set -euo pipefail

siteDir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
serverHost="127.0.0.1"
serverPort="${AWMPC_STATIC_PORT:-8765}"
tempDir="$(mktemp -d "${TMPDIR:-/tmp}/awmpc-static.XXXXXX")"
serverPid=""

pages=(
  "mi_home:index.html"
  "mi_mission:mission.html"
  "mi_sermons:sermons.html"
  "mi_testimony:testimony.html"
  "mi_request:request.html"
  "mi_24hrhop:24hrhop.html"
  "mi_support:support.html"
  "mi_media:media.html"
  "mi_letters:letters.html"
  "mi_canaan_record:canaan_record.html"
  "mi_prayer:prayer.html"
  "hymns:hymns.html"
)

cleanup() {
  if [[ -n "$serverPid" ]] && kill -0 "$serverPid" 2>/dev/null; then
    kill "$serverPid" 2>/dev/null || true
    wait "$serverPid" 2>/dev/null || true
  fi
  rm -rf "$tempDir"
}
trap cleanup EXIT INT TERM

if ! command -v php >/dev/null 2>&1; then
  echo "Error: PHP is required to render the site locally." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required to fetch pages from the local PHP server." >&2
  exit 1
fi

if [[ ! "$serverPort" =~ ^[0-9]+$ ]] || (( 10#$serverPort < 1 || 10#$serverPort > 65535 )); then
  echo "Error: AWMPC_STATIC_PORT must be a TCP port from 1 to 65535." >&2
  exit 1
fi

(
  cd "$siteDir"
  exec php -S "${serverHost}:${serverPort}" -t "$siteDir"
) >"$tempDir/php-server.log" 2>&1 &
serverPid=$!

serverUrl="http://${serverHost}:${serverPort}/wmpc_pager.php"
for attempt in {1..50}; do
  if ! kill -0 "$serverPid" 2>/dev/null; then
    echo "Error: local PHP server failed to start." >&2
    sed -n '1,120p' "$tempDir/php-server.log" >&2
    exit 1
  fi
  if curl --silent --show-error --fail --output /dev/null "${serverUrl}?page=mi_home"; then
    break
  fi
  if [[ "$attempt" -eq 50 ]]; then
    echo "Error: local PHP server did not become ready." >&2
    sed -n '1,120p' "$tempDir/php-server.log" >&2
    exit 1
  fi
  sleep 0.1
done

for page in "${pages[@]}"; do
  IFS=: read -r pageKey outputFile <<< "$page"
  tempOutput="$tempDir/$outputFile"
  curl --silent --show-error --fail --location \
    "${serverUrl}?page=${pageKey}" \
    --output "$tempOutput"
done

for page in "${pages[@]}"; do
  IFS=: read -r pageKey outputFile <<< "$page"
  tempOutput="$tempDir/$outputFile"
  mv "$tempOutput" "$siteDir/$outputFile"
  echo "Rendered ${outputFile} from ${pageKey}"
done
