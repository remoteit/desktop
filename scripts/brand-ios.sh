#!/bin/bash

# This script handles branding for the iOS platform
# Usage: BRAND=brandname ./scripts/brand-ios.sh
# Example: BRAND=remoteit ./scripts/brand-ios.sh

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common.sh"

# Initialize branding with platform name
init_branding "ios"

# Set iOS-specific path
IOS_PATH="$PROJECT_ROOT/ios"

# First, apply web branding as a base
"$SCRIPT_DIR/brand-web.sh"

# Extract config values
extract_config "ios"

# Generate Capacitor assets
generate_capacitor_assets

# Copy iOS-specific assets if they exist
if [ -d "$SOURCE_PATH/ios" ]; then
  echo "Copying $BRAND iOS assets..."
  
  # Copy icons and splash screens
  if [ -d "$SOURCE_PATH/ios/Images.xcassets" ]; then
    cp -R "$SOURCE_PATH/ios/Images.xcassets" "$IOS_PATH/"
  fi
  
  # Copy any other iOS-specific files
  if [ -d "$SOURCE_PATH/ios/src" ]; then
    cp -R "$SOURCE_PATH/ios/src/"* "$IOS_PATH/"
  fi
fi

# Update iOS app name in Info.plist
INFO_PLIST="$IOS_PATH/App/Info.plist"
if [ -f "$INFO_PLIST" ]; then
  echo "Updating iOS app name to $APP_NAME..."
  # Use plutil if available, otherwise use sed
  if command -v plutil &> /dev/null; then
    plutil -replace CFBundleDisplayName -string "$APP_NAME" "$INFO_PLIST"
    plutil -replace CFBundleName -string "$APP_NAME" "$INFO_PLIST"
  else
    # Fallback to sed for basic replacement
    sed -i.bak "s/<key>CFBundleDisplayName<\/key>\\s*<string>[^<]*<\/string>/<key>CFBundleDisplayName<\/key>\\n\\t<string>$APP_NAME<\/string>/g" "$INFO_PLIST"
    sed -i.bak "s/<key>CFBundleName<\/key>\\s*<string>[^<]*<\/string>/<key>CFBundleName<\/key>\\n\\t<string>$APP_NAME<\/string>/g" "$INFO_PLIST"
    rm -f "${INFO_PLIST}.bak"
  fi
fi

# Update bundle identifier in project.pbxproj if needed
PROJECT_PBXPROJ="$IOS_PATH/App/App.xcodeproj/project.pbxproj"
if [ -f "$PROJECT_PBXPROJ" ] && [ ! -z "$BUNDLE_ID" ]; then
  echo "Updating iOS bundle identifier to $BUNDLE_ID..."
  # Use sed to replace the PRODUCT_BUNDLE_IDENTIFIER
  sed -i.bak "s/PRODUCT_BUNDLE_IDENTIFIER = \"[^\"]*\"/PRODUCT_BUNDLE_IDENTIFIER = \"$BUNDLE_ID\"/g" "$PROJECT_PBXPROJ"
  rm -f "${PROJECT_PBXPROJ}.bak"
fi

echo "iOS branding complete for $BRAND." 