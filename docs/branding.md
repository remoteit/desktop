# Multi-Brand Build System

This document explains how to use the multi-brand build system to create builds for different brands across web, desktop, and mobile platforms.

## Overview

The application supports building for multiple brands based on the directories in `brands/`. The default brand is `remoteit` if no brand is specified.

The system supports branding for multiple platforms:
- **web** - Standard web application
- **electron** - Desktop application using Electron
- **android** - Android mobile application using Capacitor
- **ios** - iOS mobile application using Capacitor

## Brand Assets Structure

Each brand should have its assets organized in the following structure:

```
brands/
├── brand1/
│   ├── config.json   # Brand theme configuration
│   ├── logo.svg           # Brand logo
│   ├── brand-config.json  # Brand configuration
│   ├── electron/          # Electron-specific assets
│   │   ├── icon.png
│   │   └── ...
│   ├── android/           # Android-specific assets
│   │   ├── mipmap-hdpi/
│   │   ├── mipmap-mdpi/
│   │   └── ...
│   └── ios/               # iOS-specific assets
│       ├── AppIcon.appiconset/
│       └── ...
└── brand2/
    ├── config.json
    ├── logo.svg
    ├── brand-config.json
    └── ...
```

## Brand Configuration

Each brand should have a `brand-config.json` file with the following structure:

```json
{
  "appName": "Brand Name",
  "appId": "com.brand.desktop",
  "bundleId": "com.brand.app",
  "description": "Brand cross platform application",
  "author": {
    "name": "Brand Company",
    "email": "support@brand.com"
  },
  "homepage": "https://app.brand.com",
  "copyright": "Brand Company, Inc"
}
```

If this file is not present, the system will derive values from the brand name.

## Branding and Building

### Branding Only

To apply branding without building:

```bash
# Apply platform-specific branding
BRAND=brand1 npm run brand-web
BRAND=brand2 npm run brand-electron
BRAND=brand1 npm run brand-android
BRAND=brand2 npm run brand-ios

# Apply branding for a single brand across all platforms
BRAND=brand1 npm run brand-all

# Apply branding for all brands for a specific platform
npm run brand-all-brands web
npm run brand-all-brands electron
npm run brand-all-brands android
npm run brand-all-brands ios

# Apply branding for all brands for all platforms
npm run brand-all-brands
```

### Building with Automatic Branding

The build scripts now automatically apply the appropriate branding before building:

```bash
# Set the brand environment variable
BRAND=brand1

# Build for web
npm run build-frontend

# Build for desktop
npm run build-backend
cd electron && npm run build && npm run build-electron

# Build for mobile
npm run build-mobile
npm run android  # For Android
npm run ios      # For iOS
```

Each build command will automatically run the appropriate branding script before building, so you don't need to run the branding scripts separately.

## How It Works

The branding system consists of several platform-specific scripts:

1. `brand-web.sh` - Handles web-specific branding
2. `brand-electron.sh` - Handles Electron-specific branding
3. `brand-android.sh` - Handles Android-specific branding
4. `brand-ios.sh` - Handles iOS-specific branding
5. `brand-all.sh` - Applies branding for all brands for a specific platform or all platforms

The workflow is:
1. Set the `BRAND` environment variable (defaults to "remoteit" if not set)
2. Run the build command for your platform:
   - `npm run build-frontend` for web (automatically runs `brand-web.sh`)
   - `npm run build-backend` for backend (automatically runs `brand-electron.sh`)
   - `npm run build-electron` for Electron (automatically runs `brand-electron.sh`)
   - `npm run build-mobile` for mobile (automatically runs both `brand-android.sh` and `brand-ios.sh`)
   - `npm run android` for Android (automatically runs `brand-android.sh`)
   - `npm run ios` for iOS (automatically runs `brand-ios.sh`)

## Integration with Existing Build System

The branding system is now fully integrated with the existing build scripts:

- `build-frontend` - Builds the web frontend (automatically runs `brand-web.sh`)
- `build-backend` - Builds the backend services (automatically runs `brand-electron.sh`)
- `build-electron` - Builds the Electron desktop app (automatically runs `brand-electron.sh`)
- `build-mobile` - Builds the mobile app for Capacitor (automatically runs both `brand-android.sh` and `brand-ios.sh`)
- `android` - Runs the Android app (automatically runs `brand-android.sh`)
- `ios` - Runs the iOS app (automatically runs `brand-ios.sh`)

## Output Locations

- **Web**: `frontend/build`
- **Electron**: `electron/dist/`
- **Android**: Requires completing the build in Android Studio
- **iOS**: Requires completing the build in Xcode

## Adding a New Brand

To add a new brand:

1. Create a new directory in `brands/` with the brand name
2. Add the required assets (config.json, logo.svg, etc.)
3. Create a `brand-config.json` file (copy from template)
4. Add platform-specific assets in subdirectories (electron, android, ios)

The system will automatically discover the new brand and make it available for branding and building. 