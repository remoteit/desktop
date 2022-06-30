import { lightColors, darkColors, spacing, radius, fontSizes } from './'
import { createTheme, Theme, ThemeOptions, PaletteOptions } from '@mui/material/styles'
import { ApplicationState } from '../store'

declare module '@mui/styles' {
  interface DefaultTheme extends Theme {}
}

export const jssTheme = (isDark: boolean): ThemeOptions => {
  const colors = isDark ? darkColors : lightColors

  const palette = {
    mode: isDark ? 'dark' : 'light',
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
    palette: palette as PaletteOptions,
    typography: {
      fontFamily: "'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    },
    components: {
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: palette.screen.main, '&.MuiDivider-flexItem': { height: 1 } },
          inset: { marginRight: spacing.md, marginLeft: spacing.md },
        },
      },
      MuiAccordion: {
        styleOverrides: {
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
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: { display: 'block', padding: 0 },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: { minHeight: 0, padding: 0, '&.Mui-expanded': { minHeight: 0 } },
          content: { margin: 0, '&.Mui-expanded': { margin: 0 } },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: { fontSize: 10 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: radius, padding: spacing.sm },
        },
      },
      MuiButton: {
        styleOverrides: {
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
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            borderRadius: radius,
            '& .MuiTouchRipple-root': {
              color: palette.primary.main,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            color: palette.grayDarker.main,
            borderRadius: radius,
            backgroundColor: palette.grayLightest.main,
          },
          colorPrimary: { color: palette.alwaysWhite.main },
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
      },
      MuiSnackbar: {
        styleOverrides: {
          anchorOriginBottomLeft: { bottom: '80px !important', marginRight: spacing.lg },
        },
      },
      MuiSnackbarContent: {
        styleOverrides: {
          root: { borderRadius: radius, flexWrap: 'nowrap', paddingRight: spacing.lg },
          action: { '& .MuiIconButton-root': { marginRight: -spacing.sm } },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
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
      },
      MuiCardActions: {
        styleOverrides: {
          spacing: {
            paddingTop: 0,
            marginTop: -spacing.sm,
            paddingBottom: spacing.sm,
            justifyContent: 'flex-end',
          },
        },
      },
      MuiList: {
        styleOverrides: {
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
      },
      MuiBadge: {
        styleOverrides: {
          badge: {
            fontSize: fontSizes.xxs,
            height: 16,
            minWidth: 16,
            padding: spacing.xxs,
          },
        },
      },
      MuiListSubheader: {
        styleOverrides: {
          root: {
            color: palette.grayDarkest.main,
            fontSize: fontSizes.xxs,
            lineHeight: `${spacing.xl}px`,
            textTransform: 'uppercase',
            letterSpacing: 2,
            fontWeight: 500,
            paddingLeft: spacing.md,
            paddingRight: spacing.md,
          },
          sticky: {
            zIndex: 5,
            backgroundColor: palette.white.main,
          },
          gutters: {
            marginLeft: spacing.lg,
            marginRight: spacing.xs,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: radius },
          root: { backgroundColor: palette.white.main },
        },
      },
      MuiListItem: {
        styleOverrides: {
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
      },
      MuiListItemSecondaryAction: {
        styleOverrides: {
          root: {
            right: spacing.xl,
            zIndex: 2,
            '& .MuiTextField-root': { verticalAlign: 'middle' },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: { justifyContent: 'center', minWidth: 60, color: palette.grayDark.main },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          root: { zIndex: 1 },
          primary: { lineHeight: 1 },
          secondary: { fontSize: fontSizes.xs },
        },
      },
      MuiMenu: {
        styleOverrides: {
          list: {
            backgroundColor: palette.grayLightest.main,
            '& .MuiListItem-dense': {
              width: `calc(100% - ${spacing.xs * 2}px)`,
              marginLeft: spacing.xs,
              paddingRight: spacing.sm,
              marginRight: spacing.xs,
              whiteSpace: 'nowrap',
            },
            '& .MuiMenuItem-dense': { paddingTop: '2px !important', paddingBottom: '2px !important' },
            '& > .MuiList-padding': { padding: 0 },
            '& .MuiListItemIcon-root': { minWidth: 50 },
            '& .MuiDivider-root': {
              marginTop: 10,
              marginBottom: 10,
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: palette.grayDarkest.main,
            fontSize: fontSizes.base,
            '&:hover, &:focus': { backgroundColor: palette.primaryLighter.main },
            '&.MuiMenuItem-spacing.xl': {
              paddingLeft: spacing.sm,
              paddingRight: spacing.sm,
            },
          },
          gutters: {
            maxWidth: `calc(100% - ${spacing.sm * 2}px)`,
            marginLeft: spacing.sm,
            marginRight: spacing.sm,
            paddingLeft: spacing.sm,
            paddingRight: spacing.md,
          },
        },
      },
      MuiInput: {
        styleOverrides: {
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
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-input': { borderRadius: 0 },
          },
          input: {
            paddingTop: spacing.xxs,
            paddingBottom: spacing.xxs,
            borderRadius: radius,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          shrink: {
            fontSize: fontSizes.sm,
            color: palette.grayDark.main,
            letterSpacing: 0.5,
            fontWeight: 500,
            textTransform: 'uppercase',
            lineHeight: 1,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            marginTop: spacing.xxs,
            marginBottom: spacing.xxs,
            '& label + .MuiInputBase-formControl': { marginTop: 7 },
            '& .MuiInputBase-sizeSmall': {
              height: 20,
              borderRadius: 10,
              fontSize: fontSizes.xxs,
              '&:hover:not(.Mui-disabled)': { backgroundColor: palette.primaryHighlight.main },
              '& .MuiSelect-icon': { fontSize: '1.2rem', marginTop: spacing.xxs },
            },
            '& .Mui-disabled': {
              '& .MuiSelect-root': { paddingRight: spacing.sm },
              '& svg': { display: 'none' },
            },
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            padding: 0,
            borderTopLeftRadius: radius,
            borderBottomLeftRadius: radius,
            borderTopRightRadius: radius,
            borderBottomRightRadius: radius,
            backgroundColor: palette.grayLightest.main,
            '&.Mui-focused': { backgroundColor: palette.primaryHighlight.main },
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
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: radius },
        },
      },
      MuiSelect: {
        styleOverrides: {
          // root: { borderRadius: radius, padding: `${spacing.sm}px ${spacing.md}px` },
          select: { '&:focus': { backgroundColor: 'none' } },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          marginDense: {
            '& .MuiFilledInput-input': { paddingTop: spacing.sm, paddingBottom: spacing.sm },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
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
      },
      MuiTypography: {
        styleOverrides: {
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
            padding: `${spacing.xxs}px ${spacing.md}px ${spacing.xxs}px ${spacing.xl}px`,
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
          // colorTextSecondary: {
          //   color: palette.grayDark.main,
          //   '& b': { color: palette.grayDarkest.main, fontWeight: 400 },
          // },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { margin: `${spacing.lg}px ${spacing.xl}px 0`, padding: 0 },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { margin: `${spacing.sm}px ${spacing.xl}px`, padding: 0 },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { margin: `${spacing.sm}px ${spacing.md}px`, padding: 0 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { '& .MuiDivider-root': { margin: `${spacing.xxs}px -${spacing.sm}px`, opacity: 0.2 } },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { padding: `${spacing.xs}px ${spacing.xl}px`, borderBottom: `1px solid ${palette.grayLighter.main}` },
        },
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
