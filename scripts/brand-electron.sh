#!/bin/bash

# This script handles branding for the electron platform
# Usage: ./scripts/brand-electron.sh brandname
# Example: ./scripts/brand-electron.sh remoteit
# Or: BRAND=remoteit ./scripts/brand-electron.sh

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
TARGET_PATH="$PROJECT_ROOT/electron/build"
ELECTRON_SRC_DIR="$PROJECT_ROOT/electron/src"

# Check if the brand directory exists
if [ ! -d "$SOURCE_PATH" ]; then
  echo "Error: Brand directory for '$BRAND' does not exist."
  exit 1
fi

echo "Setting up $BRAND for electron platform..."

# First, apply web branding as a base
"$SCRIPT_DIR/brand-web.sh" "$BRAND"

# Update electron configuration
echo "Updating Electron configuration for $BRAND..."
npx ts-node "$SCRIPT_DIR/brand-electron.ts"

# Create dev-app-update.yml
echo "Creating dev-app-update.yml..."
cat > "$PROJECT_ROOT/electron/dev-app-update.yml" << EOL
provider: github
owner: $BRAND
repo: desktop
EOL

# Check for brand-specific electron assets
BRAND_ELECTRON_PATH="$SOURCE_PATH/electron"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_PATH"

# Check if brand-specific electron directory exists
if [ -d "$BRAND_ELECTRON_PATH" ]; then
  echo "Copying $BRAND electron assets..."
  cp -R "$BRAND_ELECTRON_PATH/"* "$TARGET_PATH/" 2>/dev/null || :
else
  echo "No brand-specific electron assets found, using defaults..."
  # Copy default assets from source directory
  cp -R "$ELECTRON_SRC_DIR/icons" "$TARGET_PATH/"
  cp -R "$ELECTRON_SRC_DIR/images" "$TARGET_PATH/"
fi

echo "Electron branding complete for $BRAND." 