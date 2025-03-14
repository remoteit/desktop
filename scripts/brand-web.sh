#!/bin/bash

# This script handles branding for the web platform
# Usage: BRAND=brandname ./scripts/brand-web.sh
# Example: BRAND=remoteit ./scripts/brand-web.sh

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common.sh"

# Initialize branding with platform name
init_branding "web"

# Get directory paths
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"

# Load environment variables from .env file if it exists
ENV_FILE="$PROJECT_ROOT/.env"
if [ -f "$ENV_FILE" ]; then
  echo "Loading environment from $ENV_FILE"
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Get the brand from environment variable or use default
BRAND=${BRAND:-remoteit}

# Rest of paths
SOURCE_PATH="$PROJECT_ROOT/brands/$BRAND"
TARGET_PATH="$PROJECT_ROOT/common/src/brand"
FRONTEND_PUBLIC_DIR="$PROJECT_ROOT/frontend/public/brand"

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

# Copy public assets to frontend
if [ -d "$FRONTEND_PUBLIC_DIR" ]; then
  rm -rf "$FRONTEND_PUBLIC_DIR"
fi
cp -R "$SOURCE_PATH/public" "$FRONTEND_PUBLIC_DIR"

echo "Web branding complete for $BRAND."