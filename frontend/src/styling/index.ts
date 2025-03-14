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
  //            px   theme.spacing
  bug: 1, //    7    0.125
  xxxs: 2, //   8    0.25
  xxs: 3, //    10   0.375
  xs: 6, //     11   0.75
  sm: 12, //    12   1.5
  base: 14, //  14   1.75
  md: 18, //    16   2.25
  lg: 24, //    19   3
  xl: 36, //    24   4.5
  xxl: 48, //   36   6
  xxxl: 64, //  48   8
  max: 96, //   64   12
}

export type Colors = { [key in Color]: string }

export const lightColors: Colors = {
  primary: '#0096e7',
  primaryDark: '#034b9d',
  primaryLight: '#9ed3f0',
  primaryLighter: '#daf0ff',
  primaryHighlight: '#edf8ff',
  primaryBackground: '#EAF4FA',
  // secondary: '#75bd00', - can become the reseller logo color
  successLight: '#a4db4c',
  success: '#75bd00',
  successDark: '#436807',
  dangerLight: '#e07562',
  danger: '#d6290a',
  warning: '#ed9912',
  warningLightest: 'rgba(237,153,18,0.16)',
  warningHighlight: 'rgba(237,153,18,0.06)',
  grayLightest: '#f8fafc',
  grayLighter: '#f3f5f7',
  grayLight: '#e3e6e8',
  gray: '#b6bbbe',
  grayDark: '#9199a1',
  grayDarker: '#666',
  grayDarkest: '#333',
  black: '#000',
  white: '#fff',
  alwaysWhite: '#fff',
  hover: 'rgba(161, 180, 191, 0.13)',
  darken: 'rgba(0, 16, 26, 0.5)',
  screen: 'rgba(161, 180, 191, 0.08)',
  shadow: 'rgba(0, 16, 26, 0.2)',
  rpi: '#C51A4A',
  guide: '#593098', // '#001247',
  test: '#ffcc001d',
}

export const darkColors: Colors = {
  primary: '#0096e7',
  primaryDark: '#034b9d',
  primaryLight: '#1C72AD', // 70%
  primaryLighter: '#21435B', // 20%
  primaryHighlight: '#1f3042', //'#222D38', // 10%
  primaryBackground: '#212a35',
  // secondary: '#75bd00',
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
  grayDarker: '#bebec2',
  grayDarkest: '#d8d8da',
  black: '#fff',
  white: '#202124',
  alwaysWhite: '#fff',
  hover: 'rgba(255,255,255,0.04)',
  darken: 'rgba(255,255,255,0.3)',
  screen: 'rgba(255,255,255,0.06)',
  shadow: 'rgba(0,0,0,0.3)',
  rpi: '#C51A4A',
  guide: '#ebe985',
  test: '#ffcc001d',
}

export const radius = {
  sm: 7,
  lg: 14,
}
