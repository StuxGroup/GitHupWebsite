#!/bin/bash
# GitHupWebsite - Local dev server
# Usage: ./dev-server.sh [--no-dev-mode] [port]
#   port            default: 8000
#   --no-dev-mode   render the site and demo exactly as production would
#
# Copies site/ into .dev/public, generates 90 days of example data for the
# demo monitors in .githup.yml, builds the GitHup status page into
# .dev/public/demo and serves it all with python -m http.server, so /demo/
# works locally just like https://githup.stux.group/demo/.
#
# GitHup itself is found at $GITHUP_PATH, else ../GitHup (a sibling checkout),
# else it is cloned into .dev/GitHup.
# DEV_MODE is on by default: the demo shows GitHup's DEV MODE banner and the
# website shows its own on localhost (?nodev=1 hides the website's banner).
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=8000
export DEV_MODE=1

for arg in "$@"; do
    case "$arg" in
        --no-dev-mode) export DEV_MODE=0 ;;
        ''|*[!0-9]*) echo "Usage: $0 [--no-dev-mode] [port]" >&2; exit 1 ;;
        *) PORT="$arg" ;;
    esac
done

PY="$(command -v python3 || command -v python)"
cd "$DIR"

GITHUP="${GITHUP_PATH:-}"
if [ -z "$GITHUP" ]; then
    if [ -f "$DIR/../GitHup/githup/__init__.py" ]; then
        GITHUP="$DIR/../GitHup"
    else
        GITHUP="$DIR/.dev/GitHup"
        [ -d "$GITHUP" ] || git clone --depth 1 https://github.com/StuxGroup/GitHup.git "$GITHUP"
    fi
fi
export PYTHONPATH="$GITHUP" PYTHONDONTWRITEBYTECODE=1

rm -rf .dev/public
mkdir -p .dev
cp -r site .dev/public
"$PY" -m githup demo --config .githup.yml --data-dir .dev/data
"$PY" -m githup site --config .githup.yml --data-dir .dev/data \
    --incidents-file .dev/data/incidents.json --out .dev/public/demo --no-deploy

if [ "$DEV_MODE" = "1" ]; then
    echo "GitHup website (DEV_MODE=1) at http://127.0.0.1:$PORT/  -  demo at http://127.0.0.1:$PORT/demo/"
else
    echo "GitHup website (production rendering) at http://127.0.0.1:$PORT/?nodev=1  -  demo at http://127.0.0.1:$PORT/demo/"
fi
"$PY" -m http.server "$PORT" --bind 127.0.0.1 --directory .dev/public
