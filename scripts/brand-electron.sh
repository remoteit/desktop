#!/bin/bash

# This script handles branding for the Electron platform
# Usage: BRAND=brandname ./scripts/brand-electron.sh
# Example: BRAND=remoteit ./scripts/brand-electron.sh

# Get the brand from environment variable or use default
BRAND=${BRAND:-remoteit}

# Get directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"
SOURCE_PATH="$PROJECT_ROOT/brands/$BRAND"

# Check if the brand directory exists
if [ ! -d "$SOURCE_PATH" ]; then
  echo "Error: Brand directory for '$BRAND' does not exist."
  exit 1
fi

echo "Setting up $BRAND for Electron platform..."

# First, apply web branding as a base
"$SCRIPT_DIR/brand-web.sh"

# Load brand configuration from the theme file if it exists
THEME_FILE="$SOURCE_PATH/brand-config.json"
if [ -f "$THEME_FILE" ]; then
  # Extract values from JSON using jq if available, otherwise use grep/sed
  if command -v jq &> /dev/null; then
    APP_NAME=$(jq -r '.appName' "$THEME_FILE")
    APP_ID=$(jq -r '.appId' "$THEME_FILE")
  else
    # Fallback to grep/sed for basic extraction
    APP_NAME=$(grep -o '"appName":[^,}]*' "$THEME_FILE" | sed 's/"appName":[[:space:]]*"\([^"]*\)"/\1/')
    APP_ID=$(grep -o '"appId":[^,}]*' "$THEME_FILE" | sed 's/"appId":[[:space:]]*"\([^"]*\)"/\1/')
  fi
else
  # If no config file exists, derive values from the brand name
  # This is a fallback mechanism
  APP_NAME=${APP_NAME:-$(echo "$BRAND" | sed 's/\b\(.\)/\u\1/g')}  # Capitalize first letter
  APP_ID=${APP_ID:-"com.$BRAND.desktop"}
fi

# Update electron package.json with brand-specific values
echo "Updating Electron configuration for $BRAND..."

# Use node to update the package.json
node -e "
  const fs = require('fs');
  const path = require('path');
  const electronPackagePath = path.join('$PROJECT_ROOT', 'electron', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(electronPackagePath, 'utf8'));
  
  pkg.name = '$BRAND';
  pkg.productName = '$APP_NAME';
  pkg.description = '$APP_NAME cross platform desktop application';
  pkg.build.appId = '$APP_ID';
  
  fs.writeFileSync(electronPackagePath, JSON.stringify(pkg, null, 2));
"

# Copy brand-specific icons to electron directory if they exist
if [ -d "$SOURCE_PATH/electron" ]; then
  echo "Copying $BRAND electron assets..."
  cp -R "$SOURCE_PATH/electron/"* "$PROJECT_ROOT/electron/src/icons/"
fi

echo "Electron branding complete for $BRAND." 