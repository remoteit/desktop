export type FontSize = 'xxs' | 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl'

export const fontSizes: { [key in FontSize]: number } = {
  xxs: 10,
  xs: 11,
  sm: 12,
  base: 16,
  md: 16,
  lg: 19,
  xl: 24,
  xxl: 36,
  xxxl: 48,
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
  grayLightest: '#fafafa',
  grayLighter: '#efefef',
  grayLight: '#dbdbdb',
  gray: '#bbb',
  grayDark: '#999',
  grayDarker: '#595959',
  grayDarkest: '#333',
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
