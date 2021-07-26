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
  | 'guide'
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
  | 'test'

export const colors: { [key in Color]: string } = {
  primary: '#0096e7',
  primaryLight: '#9ed3f0',
  primaryLighter: '#d7effc',
  primaryHighlight: '#edf8ff',
  secondary: '#75bd00',
  guide: '#001247', //'#9651c4',
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
  darken: 'rgba(0,0,0,0.15)',
  screen: 'rgba(0,0,0,0.03)',
  rpi: '#c51a4a',
  test: '#fffcf0',
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

export const radius: number = 8

export const page = {
  marginVertical: 30,
  marginHorizontal: 50,
}

export default { fontSizes, colors, spacing, page }
