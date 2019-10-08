export type FontSize = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'xxl'

export const fontSizes: { [key in FontSize]: number } = {
  xs: 11,
  sm: 12,
  base: 16,
  md: 16,
  lg: 19,
  xl: 24,
  xxl: 36,
}

export type Color =
  | 'primary'
  | 'primaryLight'
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

export const colors: { [key in Color]: string } = {
  primary: '#0096e7',
  primaryLight: '#9ed3f0',
  primaryHighlight: '#edf8ff',
  secondary: '#0d6dba',
  successLight: '#a4db4c',
  success: '#7fc40f',
  successDark: '#436807',
  dangerLight: '#e07562',
  danger: '#d6290a',
  dangerDark: '#871a06',
  warning: '#ed9912',
  gray: '#969696',
  grayLightest: '#f5f5f5',
  grayLighter: '#e0e0e0',
  grayLight: '#c1c1c1',
  grayDark: '#595959',
  grayDarker: '#383838',
  grayDarkest: '#1c1c1c',
  white: 'white',
  black: 'black',
}

export type Spacing = 'xs' | 'sm' | 'md' | 'reg' | 'lg' | 'xl' | 'xxl'

export const spacing: { [key in Spacing]: number } = {
  xs: 3,
  sm: 6,
  md: 12,
  reg: 18,
  lg: 24,
  xl: 48,
  xxl: 96,
}

export const page = {
  marginVertical: 30,
  marginHorizontal: 50,
}

export default { fontSizes, colors, spacing, page }
