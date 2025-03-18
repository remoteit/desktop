# Brand Assets

This directory contains brand-specific assets and configurations for different platforms.

## Electron Assets

Each brand directory should include an `electron` subdirectory with the following structure:

```
brands/
├── brandname/
│   ├── electron/
│   │   ├── icons/
│   │   │   ├── icon.icns            # macOS app icon
│   │   │   ├── icon_512x512.png     # 512x512 app icon
│   │   │   ├── icon_256x256.png     # 256x256 app icon
│   │   │   ├── icon_128x128.png     # 128x128 app icon
│   │   │   ├── ... (other icon sizes)
│   │   ├── images/
│   │   │   ├── icon.png             # General app icon
│   │   │   ├── iconTemplate.png     # Template icon for macOS menu bar
│   │   │   ├── iconTemplate@2x.png  # Retina template icon
│   │   │   ├── ... (other UI images)
```

During the build process, these assets will be copied to `electron/generated-assets/` and then to the appropriate build directories. The `electron/generated-assets/` directory is excluded from git.

## How It Works

When you run an Electron build with a specific brand:

1. The `brand-electron.sh` script copies brand-specific assets from `brands/[brandname]/electron/` to `electron/generated-assets/`
2. These assets are then copied to the appropriate build directories
3. The build process uses these assets for the final application

## Adding a New Brand

To add assets for a new brand:

1. Create a directory structure similar to the above example
2. Add the necessary icons and images
3. Run the build with your brand: `BRAND=yourbrandname ./scripts/brand-electron.sh` 