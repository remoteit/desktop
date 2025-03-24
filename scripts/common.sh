#!/bin/bash

# Common utility functions for branding scripts
# This file should be sourced by other scripts

# Get directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"

# Generate Capacitor assets for the current brand
generate_capacitor_assets() {
  echo "Generating Capacitor assets for $BRAND..."
  npx @capacitor/assets generate --assetPath="./brands/$BRAND/assets" --iconBackgroundColor '#034b9d' --splashBackgroundColor '#034b9d' --android --ios
}

# Load environment variables from .env file
load_env_vars() {
  local ENV_FILE="$PROJECT_ROOT/.env"
  if [ -f "$ENV_FILE" ]; then
    echo "Loading environment from $ENV_FILE"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
  fi
}

# Initialize common settings for all brand scripts
init_branding() {
  local PLATFORM="$1"
  
  # Load environment variables
  load_env_vars
  
  # Get the brand from environment variable or use default
  BRAND=${BRAND:-remoteit}
  
  # Set common paths
  SOURCE_PATH="$PROJECT_ROOT/brands/$BRAND"
  TARGET_PATH="$PROJECT_ROOT/common/src/brand"
  FRONTEND_PUBLIC_DIR="$PROJECT_ROOT/frontend/public/brand"
  
  # Check if the brand directory exists
  if [ ! -d "$SOURCE_PATH" ]; then
    echo "Error: Brand directory for '$BRAND' does not exist."
    exit 1
  fi
  
  echo "Setting up $BRAND for $PLATFORM platform..."
}

# Extract config values from TypeScript or JSON files
extract_config() {
  local PLATFORM="$1"
  
  # Define config file paths
  CONFIG_TS_FILE="$SOURCE_PATH/config.ts"
  CONFIG_JSON_FILE="$SOURCE_PATH/config.json"
  THEME_FILE="$SOURCE_PATH/brand-config.json"
  
  # First try to extract from TypeScript file
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
    if [ -z "$PACKAGE_HOMEPAGE" ]; then
      PACKAGE_HOMEPAGE=$(grep -o 'homepage: "[^"]*"' "$CONFIG_TS_FILE" | sed 's/homepage: "\\([^"]*\\)"/\\1/')
    fi
    if [ -z "$PACKAGE_DESCRIPTION" ]; then
      PACKAGE_DESCRIPTION=$(grep -o 'description: "[^"]*"' "$CONFIG_TS_FILE" | sed 's/description: "\\([^"]*\\)"/\\1/')
    fi
    if [ -z "$PACKAGE_AUTHOR_NAME" ]; then
      PACKAGE_AUTHOR_NAME=$(grep -o 'name: "[^"]*"' "$CONFIG_TS_FILE" | grep -A2 "author" | sed 's/name: "\\([^"]*\\)"/\\1/' | head -1)
    fi
    if [ -z "$PACKAGE_AUTHOR_EMAIL" ]; then
      PACKAGE_AUTHOR_EMAIL=$(grep -o 'email: "[^"]*"' "$CONFIG_TS_FILE" | sed 's/email: "\\([^"]*\\)"/\\1/')
    fi
    if [ -z "$PACKAGE_BUILD_APPID" ]; then
      PACKAGE_BUILD_APPID=$(grep -o 'appId: "[^"]*"' "$CONFIG_TS_FILE" | grep -A3 "build" | sed 's/appId: "\\([^"]*\\)"/\\1/' | head -1)
    fi
    if [ -z "$PACKAGE_BUILD_COPYRIGHT" ]; then
      PACKAGE_BUILD_COPYRIGHT=$(grep -o 'copyright: "[^"]*"' "$CONFIG_TS_FILE" | sed 's/copyright: "\\([^"]*\\)"/\\1/')
    fi
    if [ -z "$PACKAGE_BUILD_PRODUCTNAME" ]; then
      PACKAGE_BUILD_PRODUCTNAME=$(grep -o 'productName: "[^"]*"' "$CONFIG_TS_FILE" | sed 's/productName: "\\([^"]*\\)"/\\1/')
    fi
    
    # Extract platform-specific IDs based on platform parameter
    if [ "$PLATFORM" = "android" ]; then
      PACKAGE_NAME=$(grep -o "androidPackageName: '[^']*'" "$CONFIG_TS_FILE" | sed "s/androidPackageName: '\\([^']*\\)'/\\1/")
      if [ -z "$PACKAGE_NAME" ]; then
        PACKAGE_NAME=$(grep -o 'androidPackageName: "[^"]*"' "$CONFIG_TS_FILE" | sed 's/androidPackageName: "\\([^"]*\\)"/\\1/')
      fi
      # Default package name to APP_ID if not specified
      PACKAGE_NAME=${PACKAGE_NAME:-$APP_ID}
    elif [ "$PLATFORM" = "ios" ]; then
      BUNDLE_ID=$(grep -o "iosBundleId: '[^']*'" "$CONFIG_TS_FILE" | sed "s/iosBundleId: '\\([^']*\\)'/\\1/")
      if [ -z "$BUNDLE_ID" ]; then
        BUNDLE_ID=$(grep -o 'iosBundleId: "[^"]*"' "$CONFIG_TS_FILE" | sed 's/iosBundleId: "\\([^"]*\\)"/\\1/')
      fi
      # Default bundle ID to APP_ID if not specified
      BUNDLE_ID=${BUNDLE_ID:-$APP_ID}
    fi
  
  # Fallback to JSON files if TypeScript file doesn't exist
  elif [ -f "$CONFIG_JSON_FILE" ] || [ -f "$THEME_FILE" ]; then
    local JSON_FILE=""
    if [ -f "$CONFIG_JSON_FILE" ]; then
      JSON_FILE="$CONFIG_JSON_FILE"
    else
      JSON_FILE="$THEME_FILE"
    fi
    
    echo "Extracting configuration from JSON file..."
    
    # Extract values from JSON using jq if available, otherwise use grep/sed
    if command -v jq &> /dev/null; then
      APP_NAME=$(jq -r '.appName' "$JSON_FILE")
      APP_ID=$(jq -r '.appId' "$JSON_FILE")
      
      # Extract platform-specific IDs based on platform parameter
      if [ "$PLATFORM" = "android" ]; then
        PACKAGE_NAME=$(jq -r '.androidPackageName // .appId' "$JSON_FILE")
      elif [ "$PLATFORM" = "ios" ]; then
        BUNDLE_ID=$(jq -r '.iosBundleId // .appId' "$JSON_FILE")
      fi
    else
      # Fallback to grep/sed for basic extraction
      APP_NAME=$(grep -o '"appName":[^,}]*' "$JSON_FILE" | sed 's/"appName":[[:space:]]*"\([^"]*\)"/\1/')
      APP_ID=$(grep -o '"appId":[^,}]*' "$JSON_FILE" | sed 's/"appId":[[:space:]]*"\([^"]*\)"/\1/')
      
      # Extract platform-specific IDs based on platform parameter
      if [ "$PLATFORM" = "android" ]; then
        PACKAGE_NAME=$(grep -o '"androidPackageName":[^,}]*' "$JSON_FILE" | sed 's/"androidPackageName":[[:space:]]*"\([^"]*\)"/\1/')
        # If androidPackageName is not found, use appId
        PACKAGE_NAME=${PACKAGE_NAME:-$APP_ID}
      elif [ "$PLATFORM" = "ios" ]; then
        BUNDLE_ID=$(grep -o '"iosBundleId":[^,}]*' "$JSON_FILE" | sed 's/"iosBundleId":[[:space:]]*"\([^"]*\)"/\1/')
        # If iosBundleId is not found, use appId
        BUNDLE_ID=${BUNDLE_ID:-$APP_ID}
      fi
    fi
  
  # If no config files exist, derive values from the brand name
  else
    echo "No configuration files found, using defaults based on brand name..."
    APP_NAME=${APP_NAME:-$(echo "$BRAND" | sed 's/\b\(.\)/\u\1/g')}  # Capitalize first letter
    APP_ID=${APP_ID:-"com.$BRAND.app"}
    
    if [ "$PLATFORM" = "android" ]; then
      PACKAGE_NAME=${PACKAGE_NAME:-$APP_ID}
    elif [ "$PLATFORM" = "ios" ]; then
      BUNDLE_ID=${BUNDLE_ID:-$APP_ID}
    fi
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
  if [ -n "$PACKAGE_BUILD_APPID" ]; then
    echo "  Package Build AppID: $PACKAGE_BUILD_APPID"
  fi
  if [ -n "$PACKAGE_BUILD_COPYRIGHT" ]; then
    echo "  Package Build Copyright: $PACKAGE_BUILD_COPYRIGHT"
  fi
  if [ -n "$PACKAGE_BUILD_PRODUCTNAME" ]; then
    echo "  Package Build Product Name: $PACKAGE_BUILD_PRODUCTNAME"
  fi
  if [ "$PLATFORM" = "android" ]; then
    echo "  Android Package Name: $PACKAGE_NAME"
  elif [ "$PLATFORM" = "ios" ]; then
    echo "  iOS Bundle ID: $BUNDLE_ID"
  fi
}

# Make the script executable when used directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "This script is meant to be sourced by other scripts, not executed directly."
  exit 1
fi 