#!/bin/bash

# This script handles branding for the Android platform
# Usage: BRAND=brandname ./scripts/brand-android.sh
# Example: BRAND=remoteit ./scripts/brand-android.sh

# Get the brand from environment variable or use default
BRAND=${BRAND:-remoteit}

# Get directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"
SOURCE_PATH="$PROJECT_ROOT/brands/$BRAND"
ANDROID_PATH="$PROJECT_ROOT/android"

# Check if the brand directory exists
if [ ! -d "$SOURCE_PATH" ]; then
  echo "Error: Brand directory for '$BRAND' does not exist."
  exit 1
fi

echo "Setting up $BRAND for Android platform..."

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
  
  # Default package name to APP_ID if not specified
  PACKAGE_NAME=$APP_ID
# Fallback to brand-config.json if TypeScript file doesn't exist
elif [ -f "$THEME_FILE" ]; then
  # Extract values from JSON using jq if available, otherwise use grep/sed
  if command -v jq &> /dev/null; then
    APP_NAME=$(jq -r '.appName' "$THEME_FILE")
    APP_ID=$(jq -r '.appId' "$THEME_FILE")
    PACKAGE_NAME=$(jq -r '.androidPackageName // .appId' "$THEME_FILE")
  else
    # Fallback to grep/sed for basic extraction
    APP_NAME=$(grep -o '"appName":[^,}]*' "$THEME_FILE" | sed 's/"appName":[[:space:]]*"\([^"]*\)"/\1/')
    APP_ID=$(grep -o '"appId":[^,}]*' "$THEME_FILE" | sed 's/"appId":[[:space:]]*"\([^"]*\)"/\1/')
    PACKAGE_NAME=$(grep -o '"androidPackageName":[^,}]*' "$THEME_FILE" | sed 's/"androidPackageName":[[:space:]]*"\([^"]*\)"/\1/')
    # If androidPackageName is not found, use appId
    if [ -z "$PACKAGE_NAME" ]; then
      PACKAGE_NAME=$APP_ID
    fi
  fi
else
  # If no config file exists, derive values from the brand name
  APP_NAME=${APP_NAME:-$(echo "$BRAND" | sed 's/\b\(.\)/\u\1/g')}  # Capitalize first letter
  PACKAGE_NAME=${PACKAGE_NAME:-"com.$BRAND.app"}
fi

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