#!/bin/bash

# Awen Music — Sync docs/index.html to awenstudio.github.io
# Usage: ./sync.sh

set -e

AWEN_MUSIC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GITHUB_REPO="awenstudio/awenstudio.github.io"
TARGET_FILE="music/index.html"

echo "🎵 Syncing Awen Music..."

# Check if docs/index.html exists
if [ ! -f "$AWEN_MUSIC_DIR/docs/index.html" ]; then
  echo "❌ docs/index.html not found!"
  exit 1
fi

# Clone target repo to temp dir
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "📦 Cloning $GITHUB_REPO..."
git clone git@github.com:${GITHUB_REPO}.git "$TEMP_DIR" --depth=1 -q

# Copy file
echo "📝 Copying docs/index.html..."
cp "$AWEN_MUSIC_DIR/docs/index.html" "$TEMP_DIR/$TARGET_FILE"

# Commit and push
cd "$TEMP_DIR"
git config user.name "Awen Studio"
git config user.email "awen@studio.local"

if git diff --quiet $TARGET_FILE; then
  echo "✅ Already up to date"
  exit 0
fi

LATEST_COMMIT=$(git -C "$AWEN_MUSIC_DIR" log -1 --pretty=format:%H)
git add $TARGET_FILE
git commit -m "sync: update $TARGET_FILE from awen-music

Auto-synced from docs/index.html
Commit: $LATEST_COMMIT" -q

git push -q
echo "✅ Synced successfully!"
