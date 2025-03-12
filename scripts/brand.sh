#!/bin/bash

# This script sets the current brand by copying the appropriate brand directory

# Get the brand from environment variable or use default
BRAND=${BRAND:-remoteit}

# Get directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"
SOURCE_PATH="$PROJECT_ROOT/common/brands/$BRAND"
TARGET_PATH="$PROJECT_ROOT/common/src/brand"

set -x

# Check if the brand directory exists
if [ ! -d "$SOURCE_PATH" ]; then
  echo "Error: Brand directory $SOURCE_PATH does not exist"
  exit 1
fi

# Remove existing target directory if it exists
if [ -d "$TARGET_PATH" ]; then
  rm -rf "$TARGET_PATH"
fi

# Copy the brand directory recursively
cp -R "$SOURCE_PATH" "$TARGET_PATH"

echo "Brand set to $BRAND"

# Run the CSS generator
"$SCRIPT_DIR/brand-public.sh"

set +x