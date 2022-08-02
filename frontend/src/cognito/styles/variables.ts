export const colors = {
  // Primary
  primary: '#0096e7',
  primaryLight: '#73cdff',
  primaryLightest: '#ccedff',

  // Secondary
  secondary: '#34c6be',

  // Success
  success: '#7fc40f',
  successLight: '#aede62',
  successLighter: '#d0f09e',

  // Info
  info: '#29a6ff',
  infoLight: '#73c5ff',
  infoLighter: '#adddff',

  // Warning
  warning: '#ffa738',
  warningLight: '#ffc780',
  warningLighter: '#ffe2bd',

  // Danger
  danger: '#d6290a',
  dangerLight: '#e36d59',
  dangerLighter: '#ffb3a6',

  // Gray
  grayDarkest: '#1c1c1c',
  grayDarker: '#383838',
  grayDark: '#595959',
  gray: '#777',
  grayLight: '#c1c1c1',
  grayLighter: '#e0e0e0',
  grayLightest: '#f5f5f5',

  white: 'white',
}

export type BrandColor = keyof typeof colors

export const spacing = {
  xxs: '3px',
  xs: '6px',
  sm: '12px',
  md: '18px',
  lg: '28px',
  xl: '42px',
  xxl: '60px',
}

export const radius = {
  xs: '0.15em',
  sm: '0.3em',
  md: '0.6em',
  lg: '1em',
  xl: '1.8em',
  pill: '100em',
}

export const fontSize = {
  base: '16px',
  xs: '10px',
  sm: '12px',
  md: '14px',
  lg: '18px',
  xl: '22px',
  xxl: '32px',
}

// :root {
//   /* Colors */
//   --color-primary: #0096e7;
//   --color-primary-dark: #0374b1;
//   --color-primary-light: #3da8da;
//   --color-primary-lightest: #d2e7f1;
//   --color-logo: #0096e7;
//   --color-logo-dark: #00499c;
//   --color-secondary: #34c6be;
//   --color-warning: #ffa738;
//   --color-warning-dark: #e28d2f;
//   --color-warning-darker: #c97518;
//   --color-warning-darkest: #914c00;
//   --color-success: #7fc40f;
//   --color-danger: #d6290a;
//   --color-gray-darkest: #1c1c1c;
//   --color-gray-darker: #383838;
//   --color-gray-dark: #595959;
//   --color-gray: #777;
//   --color-gray-light: #c1c1c1;
//   --color-gray-lighter: #e0e0e0;
//   --color-gray-lightest: #f5f5f5;
//   --color-darkest: rgba(0, 0, 0, 0.7);
//   --color-darker: rgba(0, 0, 0, 0.4);
//   --color-dark: rgba(0, 0, 0, 0.1);
//   --color-light: rgba(255, 255, 255, 0.1);
//   --color-lighter: rgba(255, 255, 255, 0.4);
//   --color-lightest: rgba(255, 255, 255, 0.7);

//   /* Spacing */
//   --spacing-xs: 6px;
//   --spacing-sm: 12px;
//   --spacing-md: 18px;
//   --spacing-lg: 28px;
//   --spacing-xl: 42px;
//   --spacing-xxl: 60px;

//   /* Font sizes */
//   --font-size-base: 16px;
//   --font-size-xs: 10px;
//   --font-size-sm: 12px;
//   --font-size-md: 14px;
//   --font-size-lg: 18px;
//   --font-size-xl: 22px;
//   --font-size-xxl: 32px;

//   /* Font families */
//   --font-family-sans-serif: 'Roboto', sans-serif;
//   --font-family-mono: 'Roboto Mono', monospace;

//   /* Box shadows */
//   --box-shadow-1: 0 0 10px rgba(0, 0, 0, 0.1);

//   /* Letter spacing */
//   --letter-spacing-lg: 0.2em;
//   --letter-spacing-xl: 0.3em;
//   --letter-spacing-xxl: 0.5em;

//   /* Buttons */
//   --button-padding: 12px 18px;
//   --button-padding-small: 6px 12px;
//   --button-padding-large: 16px 28px;
//   --button-font-size: 12px;
//   --button-font-size-small: 10px;
//   --button-font-size-large: 16px;
//   --button-border-radius: 3px;
//   --button-letter-spacing: 0.1em;
// }

// /* Breakpoints */
// @custom-media --phone-down (width < 600px);
// @custom-media --tablet-portrait-down (width < 900px);
// @custom-media --tablet-landscape-down (width < 1200px);
// @custom-media --desktop-down (width < 1800px);
// @custom-media --large-up (width > 1800px);
