#!/bin/bash

# This script sets the current brand by copying the appropriate brand file

# Get the brand from environment variable or use default
BRAND=${BRAND:-remoteit}

# Get directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"
COMMON_DIR="$PROJECT_ROOT/common"
BRANDS_DIR="$COMMON_DIR/src/branding"
SOURCE_PATH="$BRANDS_DIR/$BRAND.ts"
TARGET_PATH="$BRANDS_DIR/current.ts"

# Create directories if they don't exist
mkdir -p "$BRANDS_DIR"

# Check if the brand file exists
if [ ! -f "$SOURCE_PATH" ]; then
  echo "Error: Brand file $SOURCE_PATH does not exist"
  exit 1
fi

# Copy the brand file to current.ts
cp "$SOURCE_PATH" "$TARGET_PATH"

echo "Brand set to $BRAND"

# Run the CSS generator
"$SCRIPT_DIR/generate-css.sh" 