#!/bin/bash

# This script handles branding for the Android platform
# Usage: BRAND=brandname ./scripts/brand-android.sh
# Example: BRAND=remoteit ./scripts/brand-android.sh

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common.sh"

# Initialize branding with platform name
init_branding "android"

# Set Android-specific path
ANDROID_PATH="$PROJECT_ROOT/android"

# First, apply web branding as a base
"$SCRIPT_DIR/brand-web.sh"

# Extract config values
extract_config "android"

# Generate Capacitor assets
generate_capacitor_assets

# Copy Android-specific assets if they exist
if [ -d "$SOURCE_PATH/android" ]; then
  echo "Copying $BRAND Android assets..."
  
  # Copy icons and splash screens
  if [ -d "$SOURCE_PATH/android/res" ]; then
    cp -R "$SOURCE_PATH/android/res/"* "$ANDROID_PATH/app/src/main/res/"
  fi
  
  # Copy any other Android-specific files
  if [ -d "$SOURCE_PATH/android/src" ]; then
    cp -R "$SOURCE_PATH/android/src/"* "$ANDROID_PATH/app/src/main/"
  fi
fi

# Update Android app name in strings.xml
STRINGS_XML="$ANDROID_PATH/app/src/main/res/values/strings.xml"
if [ -f "$STRINGS_XML" ]; then
  echo "Updating Android app name to $APP_NAME..."
  # Use sed to replace the app_name value
  sed -i.bak "s/<string name=\"app_name\">[^<]*<\/string>/<string name=\"app_name\">$APP_NAME<\/string>/g" "$STRINGS_XML"
  rm -f "${STRINGS_XML}.bak"
fi

# Update package name in build.gradle if needed
BUILD_GRADLE="$ANDROID_PATH/app/build.gradle"
if [ -f "$BUILD_GRADLE" ] && [ ! -z "$PACKAGE_NAME" ]; then
  echo "Updating Android package name to $PACKAGE_NAME..."
  # Use sed to replace the applicationId
  sed -i.bak "s/applicationId \"[^\"]*\"/applicationId \"$PACKAGE_NAME\"/g" "$BUILD_GRADLE"
  rm -f "${BUILD_GRADLE}.bak"
fi

echo "Android branding complete for $BRAND." 