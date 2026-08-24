#!/usr/bin/env bash
# Two jobs around CHANGELOG.md's "## [Unreleased]" section:
#
#   extract-changelog.sh <version> [changelog-file]
#     Prints the body of "## [<version>]" (e.g. for "1.2.0", everything under
#     "## [1.2.0]" up to, but not including, the next "## [...]" heading or
#     the link-reference block at the bottom). Used by
#     .github/workflows/release.yml to fill in the GitHub Release notes.
#
#   extract-changelog.sh promote <version> [date] [changelog-file]
#     Renames "## [Unreleased]" to "## [<version>] - <date>" (date defaults
#     to today, YYYY-MM-DD) and inserts a fresh, empty "## [Unreleased]"
#     above it. Also refreshes the "[Unreleased]: .../compare/..." link and
#     adds a "[<version>]: .../releases/tag/v<version>" link at the bottom,
#     if that link-reference block exists. This is step 1 of the release
#     flow in AGENTS.md — run it, review the diff, commit, then tag.
#
# Examples:
#   scripts/extract-changelog.sh 1.2.0
#   scripts/extract-changelog.sh promote 1.2.0
#   scripts/extract-changelog.sh promote 1.2.0 2026-09-01

set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage:
  extract-changelog.sh <version> [changelog-file]
  extract-changelog.sh promote <version> [date] [changelog-file]
USAGE
  exit 1
}

extract_section() {
  local version="$1" file="$2"

  if [ ! -f "$file" ]; then
    echo "Changelog file not found: $file" >&2
    exit 1
  fi

  local body
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
    echo "Did you move [Unreleased] into a dated \"## [$version] - YYYY-MM-DD\" section first? Try: $0 promote $version" >&2
    exit 1
  fi

  printf '%s\n' "$body"
}

promote_unreleased() {
  local version="$1" date_value="$2" file="$3" tag="v${1}"

  if [ ! -f "$file" ]; then
    echo "Changelog file not found: $file" >&2
    exit 1
  fi
  if ! grep -q '^## \[Unreleased\]' "$file"; then
    echo "No \"## [Unreleased]\" heading found in $file" >&2
    exit 1
  fi
  if grep -q "^## \\[${version}\\]" "$file"; then
    echo "\"## [${version}]\" already exists in $file — nothing to promote" >&2
    exit 1
  fi

  local tmp
  tmp="$(mktemp)"

  # Turn the "## [Unreleased]" heading into an empty Unreleased section
  # followed immediately by the new dated version heading; everything that
  # used to be Unreleased's body now belongs to that new heading.
  awk -v ver="$version" -v date="$date_value" '
    /^## \[Unreleased\]/ {
      print
      print ""
      print "## [" ver "] - " date
      next
    }
    { print }
  ' "$file" > "$tmp"

  # Best-effort refresh of the reference-style links at the bottom, if any.
  local base_url
  base_url="$(awk -F'/compare/' '/^\[Unreleased\]:/ { sub(/^\[Unreleased\]:[ \t]*/, "", $1); print $1; exit }' "$tmp")"
  if [ -n "$base_url" ]; then
    local tmp2
    tmp2="$(mktemp)"
    awk -v ver="$version" -v tag="$tag" -v base="$base_url" '
      /^\[Unreleased\]:/ {
        print "[Unreleased]: " base "/compare/" tag "...HEAD"
        print "[" ver "]: " base "/releases/tag/" tag
        next
      }
      { print }
    ' "$tmp" > "$tmp2"
    mv "$tmp2" "$tmp"
  fi

  mv "$tmp" "$file"
  echo "Promoted [Unreleased] to \"## [${version}] - ${date_value}\" in $file" >&2
}

[ "$#" -ge 1 ] || usage

if [ "$1" = "promote" ]; then
  shift
  version="${1:?Usage: extract-changelog.sh promote <version> [date] [changelog-file]}"
  shift || true

  date_value=""
  if [ "$#" -ge 1 ] && [[ "${1:-}" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    date_value="$1"
    shift
  fi
  date_value="${date_value:-$(date +%F)}"
  file="${1:-CHANGELOG.md}"

  promote_unreleased "$version" "$date_value" "$file"
else
  version="$1"
  file="${2:-CHANGELOG.md}"
  extract_section "$version" "$file"
fi
