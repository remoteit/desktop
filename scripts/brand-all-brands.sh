#!/bin/bash

# This script runs branding for all available brands across all platforms
# Usage: ./scripts/brand-all-brands.sh [platform]
# Example: ./scripts/brand-all-brands.sh web
# If no platform is specified, it will brand for all platforms

# Get directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"
BRANDS_DIR="$PROJECT_ROOT/common/brands"

# Check if brands directory exists
if [ ! -d "$BRANDS_DIR" ]; then
  echo "Error: Brands directory does not exist at $BRANDS_DIR"
  exit 1
fi

# Get the platform from command line argument or default to "all"
PLATFORM=${1:-all}

# Validate platform
if [[ "$PLATFORM" != "all" && "$PLATFORM" != "web" && "$PLATFORM" != "electron" && "$PLATFORM" != "android" && "$PLATFORM" != "ios" ]]; then
  echo "Error: Invalid platform '$PLATFORM'"
  echo "Usage: $0 [platform]"
  echo "Valid platforms: all, web, electron, android, ios"
  exit 1
fi

# Get list of all brand directories
BRANDS=()
for brand_dir in "$BRANDS_DIR"/*; do
  if [ -d "$brand_dir" ]; then
    brand=$(basename "$brand_dir")
    BRANDS+=("$brand")
  fi
done

if [ ${#BRANDS[@]} -eq 0 ]; then
  echo "Error: No brands found in $BRANDS_DIR"
  exit 1
fi

echo "Found ${#BRANDS[@]} brands: ${BRANDS[*]}"

# Function to brand a specific platform for all brands
brand_platform() {
  local platform=$1
  local script="$SCRIPT_DIR/brand-$platform.sh"
  
  if [ ! -f "$script" ]; then
    echo "Error: Branding script for platform '$platform' not found at $script"
    return 1
  fi
  
  echo "===== Branding all brands for $platform platform ====="
  
  for brand in "${BRANDS[@]}"; do
    echo "Processing $brand for $platform..."
    BRAND="$brand" "$script"
    
    if [ $? -ne 0 ]; then
      echo "Warning: Failed to brand $brand for $platform"
    else
      echo "Successfully branded $brand for $platform"
    fi
    
    echo "-----------------------------------"
  done
  
  echo "===== Completed branding for $platform platform ====="
}

# Main execution
if [ "$PLATFORM" = "all" ]; then
  # Brand all platforms
  brand_platform "web"
  brand_platform "electron"
  brand_platform "android"
  brand_platform "ios"
else
  # Brand specific platform
  brand_platform "$PLATFORM"
fi

echo "All branding operations completed." 