import { lightColors, darkColors, spacing, radius, fontSizes } from './'
import { createTheme, ThemeOptions } from '@material-ui/core'
import { ApplicationState } from '../store'

const gutters = 32

export const jssTheme = (isDark: boolean): ThemeOptions => {
  const colors = isDark ? darkColors : lightColors

  const palette = {
    type: isDark ? 'dark' : 'light',
    primary: { main: colors.primary, dark: darkColors.primary },
    secondary: { main: colors.secondary, contrastText: colors.white, dark: darkColors.secondary },
    error: { main: colors.danger, dark: darkColors.danger },
    primaryLight: { main: colors.primaryLight, dark: darkColors.primaryLight },
    primaryLighter: { main: colors.primaryLighter, dark: darkColors.primaryLighter },
    primaryHighlight: { main: colors.primaryHighlight, dark: darkColors.primaryHighlight },
    primaryBackground: { main: colors.primaryBackground, dark: darkColors.primaryBackground },
    successLight: { main: colors.successLight, dark: darkColors.successLight },
    success: { main: colors.success, dark: darkColors.success },
    successDark: { main: colors.successDark, dark: darkColors.successDark },
    dangerLight: { main: colors.dangerLight, dark: darkColors.dangerLight },
    danger: { main: colors.danger, dark: darkColors.danger },
    warning: { main: colors.warning, dark: darkColors.warning },
    warningLightest: { main: colors.warningLightest, dark: darkColors.warningLightest },
    warningHighlight: { main: colors.warningHighlight, dark: darkColors.warningHighlight },
    gray: { main: colors.gray, dark: darkColors.gray },
    grayLightest: { main: colors.grayLightest, dark: darkColors.grayLightest },
    grayLighter: { main: colors.grayLighter, dark: darkColors.grayLighter },
    grayLight: { main: colors.grayLight, dark: darkColors.grayLight },
    grayDark: { main: colors.grayDark, dark: darkColors.grayDark },
    grayDarker: { main: colors.grayDarker, dark: darkColors.grayDarker },
    grayDarkest: { main: colors.grayDarkest, dark: darkColors.grayDarkest },
    black: { main: colors.black, dark: darkColors.black },
    white: { main: colors.white, dark: darkColors.white },
    alwaysWhite: { main: colors.alwaysWhite, dark: darkColors.alwaysWhite },
    darken: { main: colors.darken, dark: darkColors.darken },
    screen: { main: colors.screen, dark: darkColors.screen },
    rpi: { main: colors.rpi, dark: darkColors.rpi },
    guide: { main: colors.guide, dark: darkColors.guide },
    test: { main: colors.test, dark: darkColors.test },
  }

  return {
    palette: palette as ThemeOptions['palette'],
    typography: {
      fontFamily: "'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    },
    overrides: {
      MuiDivider: {
        root: { backgroundColor: palette.grayLighter.main, '&.MuiDivider-flexItem': { height: 1 } },
        inset: { marginRight: spacing.md, marginLeft: spacing.md },
      },
      MuiAccordion: {
        root: {
          '&.Mui-expanded': { margin: 0 },
          '&:before': { display: 'none' },
        },
        rounded: {
          borderRadius: `${radius}px !important`,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          marginTop: spacing.md,
          '&.Mui-expanded': { marginTop: spacing.md },
        },
      },
      MuiAccordionDetails: {
        root: { display: 'block', padding: 0 },
      },
      MuiAccordionSummary: {
        root: { minHeight: 0, padding: 0, '&.Mui-expanded': { minHeight: 0 } },
        content: { margin: 0, '&.Mui-expanded': { margin: 0 } },
      },
      MuiFormHelperText: { root: { fontSize: 10 } },
      MuiIconButton: {
        root: { borderRadius: radius },
      },
      MuiButton: {
        root: {
          color: palette.grayDark.main,
          borderRadius: radius,
          fontWeight: 600,
          letterSpacing: 1.5,
          whiteSpace: 'nowrap',
          fontSize: fontSizes.xs,
          padding: `${spacing.sm}px ${spacing.md}px`,
          '&.MuiSvgIcon-root': { marginLeft: spacing.sm },
          '& + .MuiButton-root': { marginLeft: spacing.sm },
        },
        contained: {
          color: palette.alwaysWhite.main,
          backgroundColor: palette.grayDark.main,
          '&:hover': { backgroundColor: palette.grayDarker.main },
          '&.Mui-disabled': { backgroundColor: palette.gray.main, color: palette.alwaysWhite.main },
          boxShadow: 'none',
        },
        text: { padding: `${spacing.sm}px ${spacing.md}px` },
        outlined: { padding: `${spacing.sm}px ${spacing.md}px`, borderColor: palette.grayLighter.main },
        sizeLarge: {
          fontSize: fontSizes.sm,
          padding: `${spacing.sm}px ${spacing.xl}px`,
        },
        sizeSmall: {
          borderRadius: spacing.md,
          fontSize: fontSizes.xxs,
          padding: `${spacing.xs}px ${spacing.md}px`,
          minWidth: spacing.xxl,
        },
      },
      MuiButtonBase: { root: { borderRadius: radius } },
      MuiTouchRipple: {
        ripple: { color: palette.primary?.main || undefined },
      },
      MuiChip: {
        root: {
          borderRadius: radius,
          backgroundColor: palette.grayLightest.main,
          color: palette.alwaysWhite.main,
          fontWeight: 500,
        },
        colorSecondary: { color: palette.alwaysWhite.main },
        clickable: {
          '&:hover, &:focus': { backgroundColor: palette.primaryLighter.main },
        },
        sizeSmall: {
          height: 20,
          borderRadius: 10,
          fontWeight: 400,
          color: 'inherit',
          letterSpacing: 0,
          fontSize: fontSizes.xxs,
          paddingLeft: spacing.xxs,
          paddingRight: spacing.xxs,
          marginRight: spacing.xxs,
        },
        outlined: {
          borderColor: palette.grayLighter.main,
          color: palette.grayDarker.main,
        },
      },
      MuiSnackbar: {
        anchorOriginBottomLeft: { bottom: '80px !important', marginRight: spacing.lg },
      },
      MuiSnackbarContent: {
        root: { borderRadius: radius, flexWrap: 'nowrap', paddingRight: spacing.lg },
        action: { '& .MuiIconButton-root': { marginRight: -spacing.sm } },
      },
      MuiCardHeader: {
        root: {
          paddingTop: spacing.xs,
          paddingBottom: spacing.xs,
          color: palette.white.main,
        },
        title: {
          fontSize: fontSizes.sm,
        },
        action: {
          fontSize: fontSizes.xxs,
          marginTop: 2,
          marginRight: 'initial',
        },
      },
      MuiCardActions: {
        spacing: {
          paddingTop: 0,
          marginTop: -spacing.sm,
          paddingBottom: spacing.sm,
          justifyContent: 'flex-end',
        },
      },
      MuiList: {
        root: {
          '&.collapseList .MuiListItem-dense': {
            paddingTop: 0,
            paddingBottom: 0,
          },
        },
        padding: {
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        },
      },
      MuiBadge: {
        badge: {
          fontSize: fontSizes.xxs,
          height: 16,
          minWidth: 16,
          padding: spacing.xxs,
        },
      },
      MuiListSubheader: {
        root: {
          color: palette.grayDarkest.main,
          fontSize: fontSizes.xxs,
          lineHeight: `${spacing.xl}px`,
          textTransform: 'uppercase',
          letterSpacing: 2,
          fontWeight: 500,
        },
        sticky: {
          zIndex: 5,
          backgroundColor: palette.white.main,
        },
      },
      MuiPaper: {
        rounded: { borderRadius: radius },
        root: { backgroundColor: palette.white.main },
      },
      MuiListItem: {
        root: {
          opacity: 1,
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 5,
          paddingBottom: 5,
          marginTop: 1,
          marginBottom: 1,
          borderRadius: radius,
          '&.Mui-selected': { backgroundColor: palette.primaryHighlight.main },
          '&.Mui-selected:hover': { backgroundColor: palette.primaryLighter.main },
        },
        gutters: {
          width: `calc(100% - ${spacing.md * 2}px)`,
          paddingLeft: spacing.xxs,
          paddingRight: spacing.xxs,
          marginLeft: spacing.md,
          marginRight: spacing.md,
        },
        button: {
          '&:hover': { backgroundColor: palette.primaryHighlight.main },
        },
        secondaryAction: {
          paddingRight: 60,
          '& .MuiFormControl-root': { verticalAlign: 'middle' },
        },
        container: {
          '& .MuiListItemSecondaryAction-root': {},
          '& .MuiListItemSecondaryAction-root.hidden': { display: 'none' },
          '&:hover': {
            '& .MuiListItemSecondaryAction-root.hidden': { display: 'block' },
            '& .hoverHide': { display: 'none' },
          },
        },
        dense: {
          '& .MuiInputBase-root': { fontSize: fontSizes.base },
          '& .MuiFormHelperText-contained': { marginTop: 0, marginBottom: spacing.xs },
        },
      },
      MuiListItemSecondaryAction: {
        root: {
          right: gutters,
          zIndex: 2,
          '& .MuiTextField-root': { verticalAlign: 'middle' },
        },
      },
      MuiListItemIcon: { root: { justifyContent: 'center', minWidth: 60, color: palette.grayDark.main } },
      MuiListItemText: {
        root: { zIndex: 1 },
        primary: { lineHeight: 1.4 },
        secondary: { fontSize: fontSizes.xs },
      },
      MuiMenu: {
        list: {
          backgroundColor: palette.grayLightest.main,
          '& .MuiListItem-dense': {
            marginLeft: spacing.xs,
            width: `calc(100% - ${spacing.xs * 2}px)`,
            whiteSpace: 'nowrap',
          },
          '& .MuiMenuItem-dense': { paddingTop: '2px !important', paddingBottom: '2px !important' },
          '& > .MuiList-padding': { padding: 0 },
          '& .MuiListItemIcon-root': { minWidth: 50 },
          '& .MuiListItem-root': {
            paddingLeft: 0,
            paddingRight: spacing.md,
          },
          '& .MuiDivider-root': {
            marginTop: 10,
            marginBottom: 10,
          },
        },
      },
      MuiMenuItem: {
        root: {
          paddingLeft: 0,
          paddingRight: spacing.md,
          color: palette.grayDarkest.main,
          fontSize: fontSizes.base,
          '&:hover, &:focus': { backgroundColor: palette.primaryLighter.main },
          '&.MuiMenuItem-gutters': {
            paddingLeft: spacing.sm,
            paddingRight: spacing.sm,
            marginLeft: spacing.sm,
            marginRight: spacing.sm,
          },
        },
      },
      MuiInput: {
        root: {
          '&.Mui-disabled': {
            color: palette.grayDarker.main,
            '& svg': { display: 'none' },
          },
        },
        underline: {
          '&.Mui-disabled:before': { borderColor: palette.grayLight.main },
          '&:before, &:after': { display: 'none' },
        },
      },
      MuiInputBase: {
        input: { paddingTop: spacing.xxs, paddingBottom: spacing.xxs, borderRadius: radius },
      },
      MuiInputLabel: {
        shrink: {
          fontSize: fontSizes.sm,
          color: palette.grayDark.main,
          letterSpacing: 0.5,
          fontWeight: 500,
          textTransform: 'uppercase',
        },
      },
      MuiTextField: {
        root: {
          marginTop: spacing.xxs,
          marginBottom: spacing.xxs,
          '& label + .MuiInput-formControl': { marginTop: 9 },
          '& .MuiInputBase-marginDense': {
            height: 20,
            borderRadius: 10,
            fontSize: fontSizes.xxs,
            '&:hover:not(.Mui-disabled)': { backgroundColor: palette.primaryHighlight.main },
            '& .Mui-disabled': { paddingRight: spacing.sm },
            '& .MuiSelect-icon': { fontSize: '1.2rem', marginTop: spacing.xxs },
          },
        },
      },
      MuiFilledInput: {
        root: {
          backgroundColor: palette.grayLightest.main,
          borderTopLeftRadius: radius,
          borderBottomLeftRadius: radius,
          borderTopRightRadius: radius,
          borderBottomRightRadius: radius,
          '&$focused': { backgroundColor: palette.primaryHighlight.main },
          '&.Mui-disabled': { backgroundColor: palette.grayLightest.main },
          '&:hover': { backgroundColor: palette.primaryHighlight.main },
          '&:focused': { backgroundColor: palette.primaryHighlight.main },
        },
        input: { padding: '22px 12px 10px' },
        underline: { '&:before, &:after': { display: 'none' } },
        inputHiddenLabel: {
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        },
      },
      MuiOutlinedInput: {
        root: { borderRadius: radius },
      },
      MuiSelect: {
        // root: { borderRadius: radius, padding: `${spacing.sm}px ${spacing.md}px` },
        select: { '&:focus': { backgroundColor: 'none' } },
      },
      MuiFormControl: {
        marginDense: {
          '& .MuiFilledInput-input': { paddingTop: spacing.sm, paddingBottom: spacing.sm },
        },
      },
      MuiLink: {
        root: { padding: `${spacing.xs}px ${spacing.xs}px` },
        underlineHover: {
          '&:hover': {
            backgroundColor: palette.primaryHighlight.main,
            borderRadius: radius,
            textDecoration: 'none',
            cursor: 'pointer',
          },
        },
      },
      MuiTypography: {
        gutterBottom: { marginBottom: spacing.md },
        h1: {
          fontSize: fontSizes.xl,
          fontWeight: 400,
          color: palette.grayDarkest.main,
          letterSpacing: -0.2,
        },
        h2: {
          fontSize: fontSizes.lg,
          fontWeight: 400,
        },
        h3: {
          fontSize: fontSizes.md,
          fontWeight: 400,
        },
        h4: {
          fontSize: fontSizes.sm,
          fontFamily: "'Roboto Mono'",
          color: palette.grayDark.main,
          marginTop: spacing.xs,
          marginBottom: spacing.sm,
        },
        subtitle1: {
          fontSize: fontSizes.xxs,
          color: palette.grayDarkest.main,
          display: 'flex',
          alignItems: 'center',
          minHeight: spacing.xl,
          padding: `${spacing.xxs}px ${gutters - 8}px ${spacing.xxs}px ${gutters}px`,
          textTransform: 'uppercase',
          letterSpacing: 2,
          marginTop: spacing.lg,
          fontWeight: 500,
        },
        body2: {
          fontSize: fontSizes.base,
          '& b': { fontWeight: 500 },
        },
        caption: {
          fontSize: fontSizes.xs,
          color: palette.grayDark.main,
          lineHeight: '1.5em',
          '& b': { color: palette.grayDarkest.main, fontWeight: 400 },
        },
        colorTextSecondary: {
          color: palette.grayDark.main,
          '& b': { color: palette.grayDarkest.main, fontWeight: 400 },
        },
      },
      MuiDialogTitle: { root: { margin: `${spacing.lg}px ${gutters}px 0`, padding: 0 } },
      MuiDialogContent: { root: { margin: `${spacing.sm}px ${gutters}px`, padding: 0 } },
      MuiDialogActions: { root: { margin: `${spacing.sm}px ${spacing.md}px`, padding: 0 } },
      MuiTooltip: { tooltip: { '& .MuiDivider-root': { margin: `${spacing.xxs}px -${spacing.sm}px`, opacity: 0.2 } } },
      MuiTableCell: {
        root: { padding: `${spacing.xs}px ${gutters}px`, borderBottom: `1px solid ${palette.grayLighter.main}` },
      },
    },
  }
}

export function selectTheme(themeMode?: ApplicationState['ui']['themeMode']) {
  const darkMode = isDarkMode(themeMode)
  console.log('SELECT THEME. DARK MODE:', darkMode)
  const theme = createTheme(jssTheme(darkMode))
  return theme
}

export function isDarkMode(themeMode?: ApplicationState['ui']['themeMode']) {
  let darkMode = window?.matchMedia && window?.matchMedia('(prefers-color-scheme: dark)').matches
  if (themeMode === 'dark') darkMode = true
  if (themeMode === 'light') darkMode = false
  return darkMode
}
