#!/usr/bin/env bash

set -euo pipefail

siteDir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
serverHost="127.0.0.1"
tempDir="$(mktemp -d "${TMPDIR:-/tmp}/awmpc-static.XXXXXX")"
serverPid=""
serverPort=""
serverUrl=""
serverLog=""

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

stopServer() {
  if [[ -n "$serverPid" ]]; then
    kill -0 "$serverPid" 2>/dev/null && kill "$serverPid" 2>/dev/null || true
    wait "$serverPid" 2>/dev/null || true
    serverPid=""
  fi
}

cleanup() {
  stopServer
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

validatePort() {
  [[ "$1" =~ ^[0-9]+$ ]] && (( 10#$1 >= 1 && 10#$1 <= 65535 ))
}

if [[ -n "${AWMPC_STATIC_PORT:-}" ]]; then
  if ! validatePort "$AWMPC_STATIC_PORT"; then
    echo "Error: AWMPC_STATIC_PORT must be a TCP port from 1 to 65535." >&2
    exit 1
  fi
  candidatePorts=("$AWMPC_STATIC_PORT")
else
  candidatePorts=( {8765..8785} )
fi

startServer() {
  local candidatePort="$1"
  serverPort="$candidatePort"
  serverUrl="http://${serverHost}:${serverPort}/wmpc_pager.php"
  serverLog="$tempDir/php-server-${serverPort}.log"

  (
    cd "$siteDir"
    exec php -S "${serverHost}:${serverPort}" -t "$siteDir"
  ) >"$serverLog" 2>&1 &
  serverPid=$!

  for attempt in {1..50}; do
    if ! kill -0 "$serverPid" 2>/dev/null; then
      stopServer
      return 1
    fi
    if curl --silent --fail --output /dev/null "${serverUrl}?page=mi_home"; then
      return 0
    fi
    sleep 0.1
  done

  stopServer
  return 1
}

serverStarted=false
for candidatePort in "${candidatePorts[@]}"; do
  if startServer "$candidatePort"; then
    serverStarted=true
    break
  fi
done

if [[ "$serverStarted" != true ]]; then
  echo "Error: local PHP server did not become ready." >&2
  if [[ -n "$serverLog" ]] && [[ -f "$serverLog" ]]; then
    sed -n '1,120p' "$serverLog" >&2
  fi
  exit 1
fi

echo "Using local PHP server at ${serverUrl}"

for page in "${pages[@]}"; do
  IFS=: read -r pageKey outputFile <<< "$page"
  tempOutput="$tempDir/$outputFile"
  curl --silent --show-error --fail --location \
    "${serverUrl}?page=${pageKey}" \
    --output "$tempOutput"

  if [[ ! -s "$tempOutput" ]] || \
    ! grep --fixed-strings --quiet '<footer class="site-footer">' "$tempOutput" || \
    ! grep --fixed-strings --quiet 'https://cdn.seal.monarx.com/image?website_id=' "$tempOutput"; then
    echo "Error: ${outputFile} did not contain the expected shared footer and Monarx seal." >&2
    exit 1
  fi
done

for page in "${pages[@]}"; do
  IFS=: read -r pageKey outputFile <<< "$page"
  tempOutput="$tempDir/$outputFile"
  mv "$tempOutput" "$siteDir/$outputFile"
  echo "Rendered ${outputFile} from ${pageKey}"
done
