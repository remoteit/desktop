#!/usr/bin/env node

import Color from 'color'

/**
 * Generate both light and dark palettes from a primary color
 */
export default function generatePalette(primaryColor) {
  const color = Color(primaryColor)

  // Generate light palette
  const light = {
    primary: color.hex(),
    primaryDark: color.darken(0.6).saturate(1.3).hex(),
    primaryLight: color.lightness(78).desaturate(0.3).hex(),
    primaryLighter: color.lightness(93).desaturate(0.2).hex(),
    primaryHighlight: color.lightness(96).desaturate(0.5).hex(),
    primaryBackground: color.lightness(95).desaturate(0.6).hex(),
  }

  // Generate dark palette
  const dark = {
    primary: color.hex(),
    primaryDark: color.lightness(17).saturate(1.5).hex(),
    primaryLight: color.lightness(37).desaturate(0.2).hex(),
    primaryLighter: color.lightness(24).desaturate(0.5).hex(),
    primaryHighlight: color.lightness(18).desaturate(0.77).hex(),
    primaryBackground: color.lightness(16).desaturate(0.88).hex(),
  }

  return { light, dark }
}

// If called directly from command line
if (process.argv[1].endsWith('generate-palette.js')) {
  const primaryColor = process.argv[2] || '#034b9d'
  console.log(JSON.stringify(generatePalette(primaryColor), null, 2))
}
