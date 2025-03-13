#!/bin/bash

# This script handles branding for the web platform
# Usage: BRAND=brandname ./scripts/brand-web.sh
# Example: BRAND=remoteit ./scripts/brand-web.sh

# Get the brand from environment variable or use default
BRAND=${BRAND:-remoteit}

# Get directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"
SOURCE_PATH="$PROJECT_ROOT/brands/$BRAND"
TARGET_PATH="$PROJECT_ROOT/common/src/brand"

# Check if the brand directory exists
if [ ! -d "$SOURCE_PATH" ]; then
  echo "Error: Brand directory for '$BRAND' does not exist."
  exit 1
fi

echo "Setting up $BRAND for web platform..."

# Copy the brand directory recursively
if [ -d "$TARGET_PATH" ]; then
  rm -rf "$TARGET_PATH"
fi
cp -R "$SOURCE_PATH" "$TARGET_PATH"

# Run the CSS generator
"$SCRIPT_DIR/brand-public.sh"

echo "Web branding complete for $BRAND." 