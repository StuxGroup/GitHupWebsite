#!/bin/bash
# GitHupWebsite - test suite (plain Python unittest, no dependencies)
# Usage: ./tests/run.sh [-v]
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PY="$(command -v python3 || command -v python)"
cd "$DIR"
"$PY" -m unittest discover -s tests "$@"
