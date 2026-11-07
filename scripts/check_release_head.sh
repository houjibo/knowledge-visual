#!/usr/bin/env bash
# Fetch errors must fail closed; a superseded successful check is not a release.
set -euo pipefail
: "${GITHUB_SHA:?GITHUB_SHA is required}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"
git fetch --no-tags origin main
if [ "$(git rev-parse FETCH_HEAD)" = "$GITHUB_SHA" ]; then
  printf 'current=true\n' >> "$GITHUB_OUTPUT"
  printf 'The checked commit is current on main.\n'
else
  printf 'current=false\n' >> "$GITHUB_OUTPUT"
  printf 'The checked commit has been superseded; skip the release.\n'
fi
