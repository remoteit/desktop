import { selectOrganizationReseller } from '../selectors/organizations'
import { lightColors, darkColors } from './'
import { store } from '../store'
import ColorConstructor from 'color'

export function applyColorPalette(isDark: boolean) {
  const colors = { ...(isDark ? darkColors : lightColors) }

  // Apply reseller color
  const state = store.getState()
  const reseller = selectOrganizationReseller(state)

  // if (reseller?.color) {
  const color = ColorConstructor(/* reseller?.color */)
  colors.primary = color.hex()
  colors.primaryDark = isDark ? color.lightness(17).saturate(1.5).hex() : color.darken(0.6).saturate(1.3).hex()
  colors.primaryLight = isDark ? color.lightness(37).desaturate(0.2).hex() : color.lightness(78).desaturate(0.3).hex()
  colors.primaryLighter = isDark ? color.lightness(24).desaturate(0.5).hex() : color.lightness(93).desaturate(0.2).hex()
  colors.primaryHighlight = isDark
    ? color.lightness(18).desaturate(0.77).hex()
    : color.lightness(96).desaturate(0.5).hex()
  colors.primaryBackground = isDark
    ? color.lightness(16).desaturate(0.88).hex()
    : color.lightness(95).desaturate(0.6).hex()
}

