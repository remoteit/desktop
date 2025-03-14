#!/bin/bash

# This script generates CSS variables from the current brand theme

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"
BRAND_DIR="$PROJECT_ROOT/common/src"
PUBLIC_DIR="$PROJECT_ROOT/frontend/public/brand"
CONFIG_PATH="$BRAND_DIR/config.json"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed. Please install jq."
  exit 1
fi

# Extract colors using jq
PRIMARY_COLOR=$(jq -r '.light.primary' $CONFIG_PATH)
PRIMARY_DARK_COLOR=$(jq -r '.light.primaryDark' $CONFIG_PATH)
PRIMARY_LIGHT_COLOR=$(jq -r '.light.primaryLight' $CONFIG_PATH)
PRIMARY_LIGHTER_COLOR=$(jq -r '.light.primaryLighter' $CONFIG_PATH)
PRIMARY_HIGHLIGHT_COLOR=$(jq -r '.light.primaryHighlight' $CONFIG_PATH)
PRIMARY_BACKGROUND_COLOR=$(jq -r '.light.primaryBackground' $CONFIG_PATH)

# Create brand directory if it doesn't exist
mkdir -p $PUBLIC_DIR

# Generate CSS variables file
CSS_VARS_PATH="$PUBLIC_DIR/theme.css"

cat > "$CSS_VARS_PATH" << EOF
/**
 * Brand colors as CSS variables
 * This file is auto-generated - DO NOT EDIT DIRECTLY
 * Import this file in your CSS to use brand colors
 */

:root {
  --primary-color: $PRIMARY_COLOR;
  --primary-dark-color: $PRIMARY_DARK_COLOR;
  --primary-light-color: $PRIMARY_LIGHT_COLOR;
  --primary-lighter-color: $PRIMARY_LIGHTER_COLOR;
  --primary-highlight-color: $PRIMARY_HIGHLIGHT_COLOR;
  --primary-background-color: $PRIMARY_BACKGROUND_COLOR;
}
EOF

echo "Generated CSS variables at $CSS_VARS_PATH"

# Copy logo if exists
LOGO_SOURCE="$BRAND_DIR/logo.svg"
LOGO_DEST="$PUBLIC_DIR/logo.svg"

if [ -f "$LOGO_SOURCE" ]; then
  cp "$LOGO_SOURCE" "$LOGO_DEST"
  echo "Copied logo.svg to $LOGO_DEST"
else
  echo "Warning: logo.svg not found at $LOGO_SOURCE"
fi