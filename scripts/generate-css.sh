#!/bin/bash

# This script generates a CSS file with brand colors from the current brand TypeScript file

# Get directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"
COMMON_DIR="$PROJECT_ROOT/common"
BRANDS_DIR="$COMMON_DIR/src/branding"
CURRENT_BRAND_PATH="$BRANDS_DIR/current.ts"
FRONTEND_PUBLIC_DIR="$PROJECT_ROOT/frontend/public"

# Create directories if they don't exist
mkdir -p "$BRANDS_DIR"
mkdir -p "$FRONTEND_PUBLIC_DIR"

# Extract colors from the current brand TypeScript file
# Using grep and sed to extract color values from the light theme
PRIMARY_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o "primary: '[^']*'" | head -1 | sed "s/primary: '\([^']*\)'/\1/")
if [ -z "$PRIMARY_COLOR" ]; then
  PRIMARY_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o 'primary: "[^"]*"' | head -1 | sed 's/primary: "\([^"]*\)"/\1/')
fi

PRIMARY_DARK_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o "primaryDark: '[^']*'" | head -1 | sed "s/primaryDark: '\([^']*\)'/\1/")
if [ -z "$PRIMARY_DARK_COLOR" ]; then
  PRIMARY_DARK_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o 'primaryDark: "[^"]*"' | head -1 | sed 's/primaryDark: "\([^"]*\)"/\1/')
fi

PRIMARY_LIGHT_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o "primaryLight: '[^']*'" | head -1 | sed "s/primaryLight: '\([^']*\)'/\1/")
if [ -z "$PRIMARY_LIGHT_COLOR" ]; then
  PRIMARY_LIGHT_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o 'primaryLight: "[^"]*"' | head -1 | sed 's/primaryLight: "\([^"]*\)"/\1/')
fi

PRIMARY_LIGHTER_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o "primaryLighter: '[^']*'" | head -1 | sed "s/primaryLighter: '\([^']*\)'/\1/")
if [ -z "$PRIMARY_LIGHTER_COLOR" ]; then
  PRIMARY_LIGHTER_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o 'primaryLighter: "[^"]*"' | head -1 | sed 's/primaryLighter: "\([^"]*\)"/\1/')
fi

PRIMARY_HIGHLIGHT_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o "primaryHighlight: '[^']*'" | head -1 | sed "s/primaryHighlight: '\([^']*\)'/\1/")
if [ -z "$PRIMARY_HIGHLIGHT_COLOR" ]; then
  PRIMARY_HIGHLIGHT_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o 'primaryHighlight: "[^"]*"' | head -1 | sed 's/primaryHighlight: "\([^"]*\)"/\1/')
fi

PRIMARY_BACKGROUND_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o "primaryBackground: '[^']*'" | head -1 | sed "s/primaryBackground: '\([^']*\)'/\1/")
if [ -z "$PRIMARY_BACKGROUND_COLOR" ]; then
  PRIMARY_BACKGROUND_COLOR=$(grep -A 10 'light: {' "$CURRENT_BRAND_PATH" | grep -o 'primaryBackground: "[^"]*"' | head -1 | sed 's/primaryBackground: "\([^"]*\)"/\1/')
fi

echo "Extracted colors from current brand:"
echo "  Primary: $PRIMARY_COLOR"
echo "  Primary Dark: $PRIMARY_DARK_COLOR"
echo "  Primary Light: $PRIMARY_LIGHT_COLOR"
echo "  Primary Lighter: $PRIMARY_LIGHTER_COLOR"
echo "  Primary Highlight: $PRIMARY_HIGHLIGHT_COLOR"
echo "  Primary Background: $PRIMARY_BACKGROUND_COLOR"

# Generate CSS variables file directly in the frontend public directory
CSS_VARS_PATH="$FRONTEND_PUBLIC_DIR/brand.css"

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
echo "CSS generation complete" 