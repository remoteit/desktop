#!/bin/bash

# This script handles branding for the web platform
# Usage: ./scripts/brand-web.sh brandname
# Example: ./scripts/brand-web.sh remoteit
# Or: BRAND=remoteit ./scripts/brand-web.sh

# Get directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"

# Save the original BRAND from the environment (if any)
ORIGINAL_BRAND="${BRAND}"

# Load environment variables from .env file
ENV_FILE="$PROJECT_ROOT/.env"
if [ -f "$ENV_FILE" ]; then
  echo "Loading environment from $ENV_FILE"
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Restore the original BRAND if it was set (prioritize over .env)
if [ -n "$ORIGINAL_BRAND" ]; then
  BRAND="$ORIGINAL_BRAND"
  echo "Using BRAND from environment: $BRAND"
fi

# Get the brand from environment variable or command line, with command line taking precedence
BRAND=${BRAND:-remoteit}
CMD_BRAND=${1}
if [ -n "$CMD_BRAND" ]; then
  BRAND=$CMD_BRAND
  echo "Using BRAND from command line: $BRAND"
fi

# Set common paths
SOURCE_PATH="$PROJECT_ROOT/brands/$BRAND"
TARGET_PATH="$PROJECT_ROOT/common/src/brand"
FRONTEND_PUBLIC_DIR="$PROJECT_ROOT/frontend/public/brand"

# Check if the brand directory exists
if [ ! -d "$SOURCE_PATH" ]; then
  echo "Error: Brand directory for '$BRAND' does not exist."
  exit 1
fi

echo "Setting up $BRAND for web platform..."

# Create target directories if they don't exist
mkdir -p "$TARGET_PATH" "$FRONTEND_PUBLIC_DIR"

# Copy brand-specific files to common/src/brand
if [ -d "$SOURCE_PATH" ]; then
  echo "Copying $BRAND web assets..."
  
  # Copy TypeScript files
  find "$SOURCE_PATH" -maxdepth 1 -name "*.ts" -o -name "*.tsx" | xargs -I{} cp {} "$TARGET_PATH/" 2>/dev/null || :
  
  # Copy public assets if they exist
  if [ -d "$SOURCE_PATH/public" ]; then
    cp -R "$SOURCE_PATH/public/"* "$FRONTEND_PUBLIC_DIR/" 2>/dev/null || :
  fi
  
  # Copy assets directory if it exists
  if [ -d "$SOURCE_PATH/assets" ]; then
    mkdir -p "$TARGET_PATH/assets"
    cp -R "$SOURCE_PATH/assets/"* "$TARGET_PATH/assets/" 2>/dev/null || :
  fi
fi

echo "Web branding complete for $BRAND."