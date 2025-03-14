#!/bin/bash

# This script handles branding for the iOS platform
# Usage: BRAND=brandname ./scripts/brand-ios.sh
# Example: BRAND=remoteit ./scripts/brand-ios.sh

# Get the brand from environment variable or use default
BRAND=${BRAND:-remoteit}

# Get directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"
SOURCE_PATH="$PROJECT_ROOT/brands/$BRAND"
IOS_PATH="$PROJECT_ROOT/ios"

# Check if the brand directory exists
if [ ! -d "$SOURCE_PATH" ]; then
  echo "Error: Brand directory for '$BRAND' does not exist."
  exit 1
fi

echo "Setting up $BRAND for iOS platform..."

# First, apply web branding as a base
"$SCRIPT_DIR/brand-web.sh"

# Load brand configuration from the config files
CONFIG_TS_FILE="$SOURCE_PATH/config.ts"
THEME_FILE="$SOURCE_PATH/brand-config.json"

# First try to extract from TypeScript file
if [ -f "$CONFIG_TS_FILE" ]; then
  # Extract values from TypeScript using grep/sed
  APP_NAME=$(grep -o "appName: '[^']*'" "$CONFIG_TS_FILE" | sed "s/appName: '\\([^']*\\)'/\\1/")
  APP_ID=$(grep -o "appId: '[^']*'" "$CONFIG_TS_FILE" | sed "s/appId: '\\([^']*\\)'/\\1/")
  
  # If double quotes are used instead of single quotes
  if [ -z "$APP_NAME" ]; then
    APP_NAME=$(grep -o 'appName: "[^"]*"' "$CONFIG_TS_FILE" | sed 's/appName: "\\([^"]*\\)"/\\1/')
  fi
  if [ -z "$APP_ID" ]; then
    APP_ID=$(grep -o 'appId: "[^"]*"' "$CONFIG_TS_FILE" | sed 's/appId: "\\([^"]*\\)"/\\1/')
  fi
  
  # Default bundle ID to APP_ID if not specified
  BUNDLE_ID=$APP_ID
# Fallback to brand-config.json if TypeScript file doesn't exist
elif [ -f "$THEME_FILE" ]; then
  # Extract values from JSON using jq if available, otherwise use grep/sed
  if command -v jq &> /dev/null; then
    APP_NAME=$(jq -r '.appName' "$THEME_FILE")
    BUNDLE_ID=$(jq -r '.iosBundleId // .appId' "$THEME_FILE")
  else
    # Fallback to grep/sed for basic extraction
    APP_NAME=$(grep -o '"appName":[^,}]*' "$THEME_FILE" | sed 's/"appName":[[:space:]]*"\([^"]*\)"/\1/')
    BUNDLE_ID=$(grep -o '"iosBundleId":[^,}]*' "$THEME_FILE" | sed 's/"iosBundleId":[[:space:]]*"\([^"]*\)"/\1/')
    
    # If iosBundleId is not found, try to use appId
    if [ -z "$BUNDLE_ID" ]; then
      BUNDLE_ID=$(grep -o '"appId":[^,}]*' "$THEME_FILE" | sed 's/"appId":[[:space:]]*"\([^"]*\)"/\1/')
    fi
  fi
else
  # If no config file exists, derive values from the brand name
  APP_NAME=${APP_NAME:-$(echo "$BRAND" | sed 's/\b\(.\)/\u\1/g')}  # Capitalize first letter
  BUNDLE_ID=${BUNDLE_ID:-"com.$BRAND.app"}
fi

# Copy iOS-specific assets if they exist
if [ -d "$SOURCE_PATH/ios" ]; then
  echo "Copying $BRAND iOS assets..."
  
  # Copy app icons
  if [ -d "$SOURCE_PATH/ios/Images.xcassets" ]; then
    cp -R "$SOURCE_PATH/ios/Images.xcassets/"* "$IOS_PATH/App/Assets.xcassets/"
  fi
  
  # Copy launch screen assets
  if [ -d "$SOURCE_PATH/ios/LaunchScreen.storyboard" ]; then
    cp "$SOURCE_PATH/ios/LaunchScreen.storyboard" "$IOS_PATH/App/"
  fi
  
  # Copy any other iOS-specific files
  if [ -d "$SOURCE_PATH/ios/App" ]; then
    cp -R "$SOURCE_PATH/ios/App/"* "$IOS_PATH/App/"
  fi
fi

# Update Info.plist with app name
INFO_PLIST="$IOS_PATH/App/Info.plist"
if [ -f "$INFO_PLIST" ]; then
  echo "Updating iOS app name to $APP_NAME..."
  
  # Use PlistBuddy if available, otherwise use sed
  if command -v /usr/libexec/PlistBuddy &> /dev/null; then
    /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $APP_NAME" "$INFO_PLIST"
  else
    # Fallback to sed for basic replacement
    sed -i.bak "s/<key>CFBundleDisplayName<\/key>[ \t]*<string>[^<]*<\/string>/<key>CFBundleDisplayName<\/key>\\
	<string>$APP_NAME<\/string>/g" "$INFO_PLIST"
    rm -f "${INFO_PLIST}.bak"
  fi
  
  # Update bundle identifier if provided
  if [ ! -z "$BUNDLE_ID" ]; then
    echo "Updating iOS bundle identifier to $BUNDLE_ID..."
    
    if command -v /usr/libexec/PlistBuddy &> /dev/null; then
      /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier $BUNDLE_ID" "$INFO_PLIST"
    else
      # Fallback to sed for basic replacement
      sed -i.bak "s/<key>CFBundleIdentifier<\/key>[ \t]*<string>[^<]*<\/string>/<key>CFBundleIdentifier<\/key>\\
	<string>$BUNDLE_ID<\/string>/g" "$INFO_PLIST"
      rm -f "${INFO_PLIST}.bak"
    fi
  fi
fi

# Update project.pbxproj with app name if needed
PBXPROJ_FILE=$(find "$IOS_PATH" -name "project.pbxproj")
if [ ! -z "$PBXPROJ_FILE" ] && [ -f "$PBXPROJ_FILE" ]; then
  echo "Updating Xcode project settings..."
  
  # Update PRODUCT_NAME and PRODUCT_BUNDLE_IDENTIFIER
  sed -i.bak "s/PRODUCT_NAME = \"[^\"]*\"/PRODUCT_NAME = \"$APP_NAME\"/g" "$PBXPROJ_FILE"
  
  if [ ! -z "$BUNDLE_ID" ]; then
    sed -i.bak "s/PRODUCT_BUNDLE_IDENTIFIER = \"[^\"]*\"/PRODUCT_BUNDLE_IDENTIFIER = \"$BUNDLE_ID\"/g" "$PBXPROJ_FILE"
  fi
  
  rm -f "${PBXPROJ_FILE}.bak"
fi

echo "iOS branding complete for $BRAND." 