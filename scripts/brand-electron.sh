#!/bin/bash

# This script handles branding for the Electron platform
# Usage: BRAND=brandname ./scripts/brand-electron.sh
# Example: BRAND=remoteit ./scripts/brand-electron.sh

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common.sh"

# Initialize branding with platform name
init_branding "electron"

# First, apply web branding as a base
"$SCRIPT_DIR/brand-web.sh"

# Extract config values
extract_config "electron"

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

# Copy brand-specific icons to electron directory if they exist
if [ -d "$SOURCE_PATH/electron" ]; then
  echo "Copying $BRAND electron assets..."
  cp -R "$SOURCE_PATH/electron/"* "$PROJECT_ROOT/electron/src/icons/"
fi

echo "Electron branding complete for $BRAND." 