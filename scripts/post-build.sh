#!/usr/bin/env bash
set -euo pipefail

# Post-build script: patches 404.html with the correct pathSegmentsToKeep value
# based on the VITE_BASE_PATH environment variable.
#
# Usage: VITE_BASE_PATH=/<repo>/pr-preview/pr-42/ ./scripts/post-build.sh

DIST_DIR="dist"
FOUR_OH_FOUR="$DIST_DIR/404.html"

if [ ! -f "$FOUR_OH_FOUR" ]; then
  echo "Warning: $FOUR_OH_FOUR not found, skipping 404.html patch"
  exit 0
fi

BASE_PATH="${VITE_BASE_PATH:-/}"

# Count path segments (strip leading/trailing slashes, then count slashes + 1)
STRIPPED=$(echo "$BASE_PATH" | sed 's|^/||;s|/$||')
if [ -z "$STRIPPED" ]; then
  SEGMENTS=0
else
  SEGMENTS=$(echo "$STRIPPED" | tr '/' '\n' | wc -l | tr -d ' ')
fi

echo "Patching 404.html: VITE_BASE_PATH=$BASE_PATH, pathSegmentsToKeep=$SEGMENTS"
sed -i.bak "s/__PATH_SEGMENTS_TO_KEEP__/$SEGMENTS/g" "$FOUR_OH_FOUR"
rm -f "$FOUR_OH_FOUR.bak"
