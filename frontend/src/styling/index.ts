export type Sizes = 'bug' | 'xxxs' | 'xxs' | 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'max'

export const fontSizes: { [key in Sizes]: string } = {
  bug: '0.4375rem', // 7px
  xxxs: '0.5rem', // 8px
  xxs: '0.625rem', // 10px
  xs: '0.6875rem', // 11px
  sm: '0.75rem', // 12px
  base: '0.875rem', // 14px
  md: '1rem', // 16px
  lg: '1.1875rem', // 19px
  xl: '1.5rem', // 24px
  xxl: '2.25rem', // 36px
  xxxl: '3rem', // 48px
  max: '4rem', // 64px
}

export const spacing: { [key in Sizes]: number } = {
  bug: 1, // 7px
  xxxs: 2, // 8px
  xxs: 3, // 10px
  xs: 6, // 11px
  sm: 12, // 12px
  base: 14, // 14px
  md: 18, // 16px
  lg: 24, // 19px
  xl: 36, // 24px
  xxl: 48, // 36px
  xxxl: 64, // 48px
  max: 96, // 64px
}

export type Color =
  | 'primary'
  | 'primaryLight'
  | 'primaryLighter'
  | 'primaryHighlight'
  | 'primaryBackground'
  | 'primaryDark'
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
  | 'shadow'
  | 'rpi'
  | 'guide'
  | 'test'

export const lightColors: { [key in Color]: string } = {
  primary: '#0096e7',
  primaryLight: '#9ed3f0',
  primaryLighter: '#e3f4ff', //'#e7f2f9',
  primaryHighlight: '#edf8ff',
  primaryBackground: '#EAF4FA',
  primaryDark: '#034b9d',
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
  screen: 'rgba(0,0,0,0.06)',
  shadow: 'rgba(0,0,0,0.2)',
  rpi: '#C51A4A',
  guide: '#593098', // '#001247',
  test: '#fffcf0',
}

export const darkColors: { [key in Color]: string } = {
  primary: '#0096e7',
  primaryLight: '#1C72AD', // 70%
  primaryLighter: '#21435B', // 20%
  primaryHighlight: '#1f3042', //'#222D38', // 10%
  primaryBackground: '#212a35',
  primaryDark: '#034b9d',
  secondary: '#75bd00',
  successLight: '#436807',
  success: '#75bd00',
  successDark: '#a4db4c',
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
  screen: 'rgba(255,255,255,0.06)',
  shadow: 'rgba(0,0,0,0.3)',
  rpi: '#C51A4A',
  guide: '#ebe985',
  test: '#2B2926',
}

export const radius: number = 8

export const page = {
  marginVertical: 30,
  marginHorizontal: 50,
}
