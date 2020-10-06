import { PropTypes } from '@material-ui/core'

export type FontSize = 'bug' | 'xxxs' | 'xxs' | 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'max'

export const fontSizes: { [key in FontSize]: number } = {
  bug: 7,
  xxxs: 8,
  xxs: 10,
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 19,
  xl: 24,
  xxl: 36,
  xxxl: 48,
  max: 64,
}

export type Color =
  | 'primary'
  | 'primaryLight'
  | 'primaryLighter'
  | 'primaryHighlight'
  | 'secondary'
  | 'successLight'
  | 'success'
  | 'successDark'
  | 'dangerLight'
  | 'danger'
  | 'dangerDark'
  | 'warning'
  | 'gray'
  | 'grayLightest'
  | 'grayLighter'
  | 'grayLight'
  | 'grayDark'
  | 'grayDarker'
  | 'grayDarkest'
  | 'white'
  | 'black'
  | 'darken'
  | 'screen'
  | 'rpi'

export const colors: { [key in Color]: string } = {
  primary: '#0096e7',
  primaryLight: '#9ed3f0',
  primaryLighter: '#e7f2f9',
  primaryHighlight: '#edf8ff',
  secondary: '#75bd00',
  successLight: '#a4db4c',
  success: '#75bd00',
  successDark: '#436807',
  dangerLight: '#e07562',
  danger: '#d6290a',
  dangerDark: '#871a06',
  warning: '#ed9912',
  grayLightest: '#f9f9f9',
  grayLighter: '#efefef',
  grayLight: '#dbdbdb',
  gray: '#bbb',
  grayDark: '#999',
  grayDarker: '#666',
  grayDarkest: '#333',
  white: '#fff',
  black: '#000',
  darken: 'rgba(0,0,0,0.2)',
  screen: 'rgba(0,0,0,0.03)',
  rpi: '#C51A4A',
}

export function muiColor(color?: Color): PropTypes.Color | undefined {
  if (!color) return
  switch (color) {
    case 'primary':
    case 'secondary':
      return color
    default:
      return 'default'
  }
}

export type Spacing = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export const spacing: { [key in Spacing]: number } = {
  xxs: 3,
  xs: 6,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 36,
  xxl: 48,
}

export const page = {
  marginVertical: 30,
  marginHorizontal: 50,
}

export default { fontSizes, colors, spacing, page }
