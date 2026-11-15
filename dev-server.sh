#!/bin/bash
# GitHupWebsite - Local dev server
# Usage: ./dev-server.sh [--no-dev-mode] [--lan] [port]
#   port            default: 8000
#   --no-dev-mode   render the site and demo exactly as production would
#   --lan           listen on all interfaces so phones/tablets on your network can
#                   connect (prints the addresses to open); default is 127.0.0.1 only
#
# Copies site/ into .dev/public, generates 90 days of example data for the
# demo monitors in .githup.yml, builds the GitHup status page into
# .dev/public/demo and serves it all with python -m http.server, so /demo/
# works locally just like https://githup.stux.group/demo/.
#
# GitHup itself is found at $GITHUP_PATH, else ../GitHup (a sibling checkout),
# else it is cloned into .dev/GitHup.
# DEV_MODE is on by default: the demo shows GitHup's DEV MODE banner and the
# website's own pages show the shared dev banner too (--no-dev-mode hides both).
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=8000
HOST=127.0.0.1
export DEV_MODE=1

for arg in "$@"; do
    case "$arg" in
        --no-dev-mode) export DEV_MODE=0 ;;
        --lan) HOST=0.0.0.0 ;;
        ''|*[!0-9]*) echo "Usage: $0 [--no-dev-mode] [--lan] [port]" >&2; exit 1 ;;
        *) PORT="$arg" ;;
    esac
done

lan_urls() {
    # This machine's IPv4 addresses (Windows, macOS or Linux), minus loopback
    case "$OSTYPE" in
        msys*|cygwin*|win32*) ADDRS="$(ipconfig | awk -F': *' '/IPv4/{print $2}' | tr -d '\r')" ;;
        darwin*) ADDRS="$(ifconfig | awk '/inet /{print $2}')" ;;
        *) ADDRS="$(hostname -I 2>/dev/null)" ;;
    esac
    echo "On your local network (--lan), open one of these on the other device:"
    for a in $ADDRS; do
        case "$a" in 127.*|'') ;; *) echo "    http://$a:$PORT$1" ;; esac
    done
    echo "  (usually the 192.168.x.x one; allow Python through the firewall if asked)"
}

PY="$(command -v python3 || command -v python)"
cd "$DIR"

GITHUP="${GITHUP_PATH:-}"
if [ -z "$GITHUP" ]; then
    if [ -f "$DIR/../GitHup/githup/__init__.py" ]; then
        GITHUP="$DIR/../GitHup"
    elif [ -f "$DIR/../../Stux.Group/GitHup/githup/__init__.py" ]; then
        GITHUP="$DIR/../../Stux.Group/GitHup"
    else
        GITHUP="$DIR/.dev/GitHup"
        [ -d "$GITHUP" ] || git clone --depth 1 https://github.com/StuxGroup/GitHup.git "$GITHUP"
    fi
fi
export PYTHONPATH="$GITHUP" PYTHONDONTWRITEBYTECODE=1

rm -rf .dev/public
mkdir -p .dev
cp -r site .dev/public
cp CHANGELOG.md VERSION.md .dev/public/   # for /changelogs/ and the footer version
# The site pages show the dev banner when assets/dev-mode.js says so; the committed copy says
# false, so only this local build gets true.
if [ "$DEV_MODE" = "1" ]; then
    echo "window.DEV_MODE = true;" > .dev/public/assets/dev-mode.js
fi
"$PY" -m githup demo --config .githup.yml --data-dir .dev/data
"$PY" -m githup site --config .githup.yml --data-dir .dev/data \
    --incidents-file .dev/data/incidents.json --out .dev/public/demo --no-deploy

if [ "$DEV_MODE" = "1" ]; then
    echo "GitHup website (DEV_MODE=1) at http://127.0.0.1:$PORT/  -  demo at http://127.0.0.1:$PORT/demo/"
else
    echo "GitHup website (production rendering) at http://127.0.0.1:$PORT/  -  demo at http://127.0.0.1:$PORT/demo/"
fi
if [ "$HOST" = "0.0.0.0" ]; then lan_urls "/"; fi
"$PY" -m http.server "$PORT" --bind "$HOST" --directory .dev/public
