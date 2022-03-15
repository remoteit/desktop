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
  | 'warning'
  | 'warningLightest'
  | 'warningHighlight'
  | 'gray'
  | 'grayLightest'
  | 'grayLighter'
  | 'grayLight'
  | 'grayDark'
  | 'grayDarker'
  | 'grayDarkest'
  | 'white'
  | 'alwaysWhite'
  | 'black'
  | 'darken'
  | 'screen'
  | 'rpi'
  | 'guide'
  | 'test'

export const lightColors: { [key in Color]: string } = {
  primary: '#0096e7',
  primaryLight: '#9ed3f0',
  primaryLighter: '#e3f4ff', //'#e7f2f9',
  primaryHighlight: '#edf8ff',
  secondary: '#75bd00',
  successLight: '#a4db4c',
  success: '#75bd00',
  successDark: '#436807',
  dangerLight: '#e07562',
  danger: '#d6290a',
  warning: '#ed9912',
  warningLightest: 'rgba(237,153,18,0.16)',
  warningHighlight: 'rgba(237,153,18,0.06)',
  grayLightest: '#f9f9f9',
  grayLighter: '#efefef',
  grayLight: '#dbdbdb',
  gray: '#bbb',
  grayDark: '#999',
  grayDarker: '#666',
  grayDarkest: '#333',
  black: '#000',
  white: '#fff',
  alwaysWhite: '#fff',
  darken: 'rgba(0,0,0,0.5)',
  screen: 'rgba(0,0,0,0.03)',
  rpi: '#C51A4A',
  guide: '#001247',
  test: '#fffcf0',
}

export const darkColors: { [key in Color]: string } = {
  primary: '#0096e7',
  primaryLight: '#1C72AD', // 70%
  primaryLighter: '#21435B', // 20%
  primaryHighlight: '#1f3042', //'#222D38', // 10%
  secondary: '#75bd00',
  successLight: '#a4db4c',
  success: '#75bd00',
  successDark: '#436807',
  dangerLight: '#e07562',
  danger: '#d6290a',
  warning: '#ed9912',
  warningLightest: 'rgba(237,153,18,0.16)',
  warningHighlight: 'rgba(237,153,18,0.06)',
  grayLightest: '#1a1b1d', //'#222326',
  grayLighter: '#292A2D', //'#35363A',
  grayLight: '#35363A', //'#54565b',
  gray: '#797c86',
  grayDark: '#97979b',
  grayDarker: '#b1b1b4',
  grayDarkest: '#d8d8da',
  black: '#fff',
  white: '#202124',
  alwaysWhite: '#fff',
  darken: 'rgba(255,255,255,0.3)',
  screen: 'rgba(255,255,255,0.03)',
  rpi: '#C51A4A',
  guide: '#4fe8bf',
  test: '#2B2926',
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
