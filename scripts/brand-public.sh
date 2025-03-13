#!/bin/bash

# This script generates CSS variables from the current brand theme

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"
BRAND_DIR="$PROJECT_ROOT/common/src/brand"
PUBLIC_DIR="$PROJECT_ROOT/frontend/public/brand"
THEME_PATH="$BRAND_DIR/theme.ts"

# Function to extract color value, checking both single and double quotes
get_color() {
  local color_name=$1
  local value=$(grep -A 10 'light: {' $THEME_PATH | grep -o "$color_name: '[^']*'" | head -1 | sed "s/$color_name: '\([^']*\)'/\1/")
  if [ -z "$value" ]; then
    value=$(grep -A 10 'light: {' $THEME_PATH | grep -o "$color_name: \"[^\"]*\"" | head -1 | sed "s/$color_name: \"\([^\"]*\)\"/\1/")
  fi
  echo "$value"
}

# Extract colors
PRIMARY_COLOR=$(get_color "primary")
PRIMARY_DARK_COLOR=$(get_color "primaryDark") 
PRIMARY_LIGHT_COLOR=$(get_color "primaryLight")
PRIMARY_LIGHTER_COLOR=$(get_color "primaryLighter")
PRIMARY_HIGHLIGHT_COLOR=$(get_color "primaryHighlight")
PRIMARY_BACKGROUND_COLOR=$(get_color "primaryBackground")

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