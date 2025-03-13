#!/bin/bash

# This script builds all available brands for all platforms
# Usage: ./scripts/build-all-brands.sh [platform]
# If platform is not specified, it will build for all platforms

# Get directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "$SCRIPT_DIR/..")"
BRANDS_DIR="$PROJECT_ROOT/brands"

# Get the platform from argument or build all
PLATFORM=${1:-all}

# Discover available brands from the brands directory
BRANDS=()
for brand_dir in "$BRANDS_DIR"/*; do
  if [ -d "$brand_dir" ]; then
    brand=$(basename "$brand_dir")
    BRANDS+=("$brand")
  fi
done

# If no brands found, exit with error
if [ ${#BRANDS[@]} -eq 0 ]; then
  echo "Error: No brand directories found in $BRANDS_DIR"
  exit 1
fi

echo "Discovered brands: ${BRANDS[*]}"

# Define available platforms
PLATFORMS=("web" "electron" "android" "ios")

# Function to build a specific brand and platform
build_brand_platform() {
  local brand=$1
  local platform=$2
  
  echo "========================================================"
  echo "Building $brand for $platform..."
  echo "========================================================"
  
  # Set the brand environment variable and call the build script
  BRAND="$brand" "$SCRIPT_DIR/build-branded.sh" "$platform"
  
  echo "Completed $brand for $platform"
  echo "========================================================"
  echo ""
}

# Build based on specified platform
if [ "$PLATFORM" = "all" ]; then
  # Build all brands for all platforms
  for brand in "${BRANDS[@]}"; do
    for platform in "${PLATFORMS[@]}"; do
      build_brand_platform "$brand" "$platform"
    done
  done
elif [[ " ${PLATFORMS[@]} " =~ " ${PLATFORM} " ]]; then
  # Build all brands for the specified platform
  for brand in "${BRANDS[@]}"; do
    build_brand_platform "$brand" "$PLATFORM"
  done
else
  echo "Error: Invalid platform '$PLATFORM'. Must be 'web', 'electron', 'android', 'ios', or 'all'."
  exit 1
fi

echo "All builds completed!" 