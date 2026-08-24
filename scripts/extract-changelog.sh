#!/usr/bin/env bash
# Prints the body of a single version section from CHANGELOG.md, e.g. for
# version "1.2.0" it prints everything under "## [1.2.0]" up to (but not
# including) the next "## [...]" heading. Used by
# .github/workflows/release.yml to fill in the GitHub Release notes.
#
# Usage: scripts/extract-changelog.sh <version> [changelog-file]
#   scripts/extract-changelog.sh 1.2.0
#   scripts/extract-changelog.sh 1.2.0 CHANGELOG.md

set -euo pipefail

version="${1:?Usage: extract-changelog.sh <version, e.g. 1.2.0> [changelog-file]}"
file="${2:-CHANGELOG.md}"

if [ ! -f "$file" ]; then
  echo "Changelog file not found: $file" >&2
  exit 1
fi

body="$(
  awk -v ver="$version" '
    $0 ~ "^## \\[" ver "\\]" { printing = 1; next }
    printing && /^## \[/ { exit }
    printing && /^\[[^]]+\]:/ { exit }
    printing { lines[++n] = $0 }
    END {
      last = n
      while (last > 0 && lines[last] ~ /^[[:space:]]*$/) last--
      first = 1
      while (first <= last && lines[first] ~ /^[[:space:]]*$/) first++
      for (i = first; i <= last; i++) print lines[i]
    }
  ' "$file"
)"

if [ -z "$body" ]; then
  echo "No changelog section found for version $version in $file" >&2
  echo "Did you move [Unreleased] into a dated \"## [$version] - YYYY-MM-DD\" section first?" >&2
  exit 1
fi

printf '%s\n' "$body"
