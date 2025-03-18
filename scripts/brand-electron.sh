#!/bin/bash

# This script handles branding for the Electron platform
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

# Check if the brand directory exists
if [ ! -d "$SOURCE_PATH" ]; then
  echo "Error: Brand directory for '$BRAND' does not exist."
  exit 1
fi

echo "Setting up $BRAND for electron platform..."

# First, apply web branding as a base
"$SCRIPT_DIR/brand-web.sh" "$BRAND"

# Extract config values
CONFIG_TS_FILE="$SOURCE_PATH/config.ts"
if [ -f "$CONFIG_TS_FILE" ]; then
  echo "Extracting configuration from TypeScript file..."
  
  # Extract values from TypeScript using grep/sed
  APP_NAME=$(grep -o "appName: '[^']*'" "$CONFIG_TS_FILE" | sed "s/appName: '\\([^']*\\)'/\\1/")
  APP_ID=$(grep -o "appId: '[^']*'" "$CONFIG_TS_FILE" | sed "s/appId: '\\([^']*\\)'/\\1/")
  
  # Extract package information if available
  PACKAGE_HOMEPAGE=$(grep -o "homepage: '[^']*'" "$CONFIG_TS_FILE" | sed "s/homepage: '\\([^']*\\)'/\\1/")
  PACKAGE_DESCRIPTION=$(grep -o "description: '[^']*'" "$CONFIG_TS_FILE" | sed "s/description: '\\([^']*\\)'/\\1/")
  PACKAGE_AUTHOR_NAME=$(grep -o "name: '[^']*'" "$CONFIG_TS_FILE" | grep -A2 "author" | sed "s/name: '\\([^']*\\)'/\\1/" | head -1)
  PACKAGE_AUTHOR_EMAIL=$(grep -o "email: '[^']*'" "$CONFIG_TS_FILE" | sed "s/email: '\\([^']*\\)'/\\1/")
  PACKAGE_BUILD_APPID=$(grep -o "appId: '[^']*'" "$CONFIG_TS_FILE" | grep -A3 "build" | sed "s/appId: '\\([^']*\\)'/\\1/" | head -1)
  PACKAGE_BUILD_COPYRIGHT=$(grep -o "copyright: '[^']*'" "$CONFIG_TS_FILE" | sed "s/copyright: '\\([^']*\\)'/\\1/")
  PACKAGE_BUILD_PRODUCTNAME=$(grep -o "productName: '[^']*'" "$CONFIG_TS_FILE" | sed "s/productName: '\\([^']*\\)'/\\1/")
  
  # If double quotes are used instead of single quotes
  if [ -z "$APP_NAME" ]; then
    APP_NAME=$(grep -o 'appName: "[^"]*"' "$CONFIG_TS_FILE" | sed 's/appName: "\\([^"]*\\)"/\\1/')
  fi
  if [ -z "$APP_ID" ]; then
    APP_ID=$(grep -o 'appId: "[^"]*"' "$CONFIG_TS_FILE" | sed 's/appId: "\\([^"]*\\)"/\\1/')
  fi
  
  # Output the extracted configuration
  echo "Configuration values:"
  echo "  App Name: $APP_NAME"
  echo "  App ID: $APP_ID"
  if [ -n "$PACKAGE_HOMEPAGE" ]; then
    echo "  Package Homepage: $PACKAGE_HOMEPAGE"
  fi
  if [ -n "$PACKAGE_DESCRIPTION" ]; then
    echo "  Package Description: $PACKAGE_DESCRIPTION"
  fi
  if [ -n "$PACKAGE_AUTHOR_NAME" ] || [ -n "$PACKAGE_AUTHOR_EMAIL" ]; then
    echo "  Package Author: $PACKAGE_AUTHOR_NAME <$PACKAGE_AUTHOR_EMAIL>"
  fi
  if [ -n "$PACKAGE_BUILD_COPYRIGHT" ]; then
    echo "  Package Build Copyright: $PACKAGE_BUILD_COPYRIGHT"
  fi
  if [ -n "$PACKAGE_BUILD_PRODUCTNAME" ]; then
    echo "  Package Build Product Name: $PACKAGE_BUILD_PRODUCTNAME"
  fi
else
  # If no config file exists, derive values from the brand name
  echo "No configuration file found, using defaults based on brand name..."
  APP_NAME=$(echo "$BRAND" | sed 's/\b\(.\)/\u\1/g')  # Capitalize first letter
  APP_ID="com.$BRAND.app"
fi

# Update electron package.json with brand-specific values
echo "Updating Electron configuration for $BRAND..."
echo "App name: $APP_NAME"
echo "App ID: $APP_ID"

# Use node to update the package.json
node -e "
  const fs = require('fs');
  const path = require('path');
  const electronPackagePath = path.join('$PROJECT_ROOT', 'electron', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(electronPackagePath, 'utf8'));
  
  pkg.name = '$BRAND';
  pkg.description = '$PACKAGE_DESCRIPTION' || '$APP_NAME cross platform desktop application for creating and hosting connections';
  pkg.homepage = '$PACKAGE_HOMEPAGE' || 'https://app.remote.it';
  
  if ('$PACKAGE_AUTHOR_NAME' !== '') {
    pkg.author = pkg.author || {};
    pkg.author.name = '$PACKAGE_AUTHOR_NAME';
  }
  
  if ('$PACKAGE_AUTHOR_EMAIL' !== '') {
    pkg.author = pkg.author || {};
    pkg.author.email = '$PACKAGE_AUTHOR_EMAIL';
  }
  
  pkg.build.appId = '$PACKAGE_BUILD_APPID' || '$APP_ID';
  pkg.build.productName = '$PACKAGE_BUILD_PRODUCTNAME' || '$APP_NAME';
  
  if ('$PACKAGE_BUILD_COPYRIGHT' !== '') {
    pkg.build.copyright = '$PACKAGE_BUILD_COPYRIGHT';
  }
  
  fs.writeFileSync(electronPackagePath, JSON.stringify(pkg, null, 2));
"

# Create electron source directories if they don't exist
ELECTRON_SRC_DIR="$PROJECT_ROOT/electron/src"
echo "Setting up directories at $ELECTRON_SRC_DIR..."
mkdir -p "$ELECTRON_SRC_DIR/icons" "$ELECTRON_SRC_DIR/images"

# Copy brand-specific assets to electron source directory
if [ -d "$SOURCE_PATH/electron" ]; then
  echo "Copying $BRAND electron assets..."
  
  # Copy icon assets if they exist
  if [ -d "$SOURCE_PATH/electron/icons" ]; then
    echo "Copying $BRAND icons to $ELECTRON_SRC_DIR/icons..."
    cp -R "$SOURCE_PATH/electron/icons/"* "$ELECTRON_SRC_DIR/icons/"
  fi
  
  # Copy image assets if they exist
  if [ -d "$SOURCE_PATH/electron/images" ]; then
    echo "Copying $BRAND images to $ELECTRON_SRC_DIR/images..."
    cp -R "$SOURCE_PATH/electron/images/"* "$ELECTRON_SRC_DIR/images/"
  fi
  
  # Copy other electron assets if they exist (directly to src directory)
  find "$SOURCE_PATH/electron" -maxdepth 1 -type f -exec cp {} "$ELECTRON_SRC_DIR/" \;
fi

echo "Electron branding complete for $BRAND." 