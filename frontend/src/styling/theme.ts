import { lightColors, darkColors, spacing, radius, fontSizes } from './'
import { createTheme, Theme, ThemeOptions, PaletteOptions } from '@mui/material/styles'
import { ApplicationState } from '../store'
import { ArrowIcon } from '../components/ArrowIcon'

declare module '@mui/styles' {
  interface DefaultTheme extends Theme {}
}

export const jssTheme = (isDark: boolean): ThemeOptions => {
  const colors = isDark ? darkColors : lightColors

  const palette = {
    mode: isDark ? 'dark' : 'light',
    info: { main: colors.grayDark },
    primary: { main: colors.primary },
    secondary: { main: colors.secondary, contrastText: colors.white },
    error: { main: colors.danger },
    primaryLight: { main: colors.primaryLight },
    primaryLighter: { main: colors.primaryLighter },
    primaryHighlight: { main: colors.primaryHighlight },
    primaryBackground: { main: colors.primaryBackground },
    successLight: { main: colors.successLight },
    success: { main: colors.success },
    successDark: { main: colors.successDark },
    dangerLight: { main: colors.dangerLight },
    danger: { main: colors.danger },
    warning: { main: colors.warning },
    warningLightest: { main: colors.warningLightest },
    warningHighlight: { main: colors.warningHighlight },
    gray: { main: colors.gray },
    grayLightest: { main: colors.grayLightest },
    grayLighter: { main: colors.grayLighter },
    grayLight: { main: colors.grayLight },
    grayDark: { main: colors.grayDark },
    grayDarker: { main: colors.grayDarker },
    grayDarkest: { main: colors.grayDarkest },
    black: { main: colors.black },
    white: { main: colors.white },
    alwaysWhite: { main: colors.alwaysWhite },
    darken: { main: colors.darken },
    screen: { main: colors.screen },
    rpi: { main: colors.rpi },
    guide: { main: colors.guide },
    test: { main: colors.test },
  }

  return {
    palette: palette as PaletteOptions,
    typography: {
      fontFamily: "'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontSize: '0.875rem',
            lineHeight: 1.43,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: palette.screen.main, '&.MuiDivider-flexItem': { height: 1 } },
          inset: { marginRight: spacing.md, marginLeft: spacing.md },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            margin: 0,
            '&.Mui-disabled': { backgroundColor: palette.white.main },
            '&.Mui-expanded': { margin: 0 },
            '&:before': { display: 'none' },
          },
          rounded: {
            borderRadius: `${radius}px !important`,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
            marginTop: spacing.md,
            '&.Mui-expanded, &.Mui-expanded:first-of-type': { marginTop: spacing.md },
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
          root: {
            minHeight: 0,
            padding: 0,
            '&.Mui-disabled': {
              opacity: 1,
              pointerEvents: 'all',
              '& .fa-caret-down': { display: 'none' },
              '& .MuiButton-root:first-of-type': { pointerEvents: 'none' },
            },
            '&.Mui-expanded': { minHeight: 0 },
          },
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
          sizeSmall: { padding: spacing.xs },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
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
          containedPrimary: {
            '&:hover': { backgroundColor: palette.primaryLight.main },
          },
          contained: {
            color: palette.alwaysWhite.main,
            '&:hover': { backgroundColor: palette.grayDarkest.main },
            '&.Mui-disabled': { backgroundColor: palette.gray.main, color: palette.alwaysWhite.main },
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
            textTransform: 'initial',
          },
          colorPrimary: { color: palette.alwaysWhite.main, backgroundColor: palette.primary.main },
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
          dot: {
            padding: 0,
            height: 8,
            minWidth: 8,
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
          root: { backgroundColor: palette.white.main, backgroundImage: 'none' },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            opacity: 1,
            marginTop: 1,
            marginBottom: 1,
            borderRadius: radius,
            '&.Mui-selected': {
              backgroundColor: palette.primaryHighlight.main,
            },
            '&.Mui-selected:hover': { backgroundColor: palette.primaryLighter.main },
            '& .MuiIconButton-sizeSmall': { marginRight: spacing.xs, marginLeft: spacing.xs },
            '& > .hidden, & > div > .hidden': { opacity: 0, transition: 'opacity 200ms 100ms' },
            '& > .hoverHide, & > div > .hoverHide': { opacity: 1, transition: 'opacity 400ms' },
            '&:hover': {
              '& > .hidden, & > div > .hidden': { opacity: 1 },
              '& > .hoverHide, & > div > .hoverHide': { opacity: 0 },
            },
          },
          gutters: {
            width: `calc(100% - ${spacing.md * 2}px)`,
            paddingLeft: spacing.xxs,
            paddingRight: spacing.xxs,
            marginLeft: spacing.md,
            marginRight: spacing.md,
          },
          padding: {
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 5,
            paddingBottom: 5,
          },
          // button: {
          //   '&:hover': { backgroundColor: palette.gray.main },
          // },
          secondaryAction: {
            paddingRight: 60,
            '& .MuiFormControl-root': { verticalAlign: 'middle' },
          },
          container: {
            // For service list
            '& .hidden': { opacity: 0, transition: 'opacity 200ms' },
            '& .hoverHide': { opacity: 1, transition: 'opacity 200ms' },
            '&:hover': { '& .hidden': { opacity: 1 }, '& .hoverHide': { opacity: 0 } },
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
          primary: { lineHeight: 1.4 },
          secondary: {
            fontSize: fontSizes.xs,
            color: palette.grayDark.main,
            '& b': { color: palette.grayDarkest.main, fontWeight: 400 },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          list: {
            backgroundColor: palette.grayLightest.main,
            '& .MuiListItem-dense, & .MuiMenuItem-dense': {
              width: `calc(100% - ${spacing.xs * 2}px)`,
              marginLeft: spacing.xs,
              marginRight: spacing.xs,
              paddingRight: spacing.sm,
              paddingLeft: spacing.sm,
              whiteSpace: 'nowrap',
            },
            '& .MuiMenuItem-dense': { paddingTop: '2px !important', paddingBottom: '2px !important' },
            '& > .MuiList-padding': { padding: 0 },
            '& .MuiListItemIcon-root': { minWidth: 50 },
            '& .MuiDivider-root': {
              marginTop: 10,
              marginBottom: 10,
              minWidth: 200,
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: palette.grayDarkest.main,
            fontSize: fontSizes.base,
          },
          gutters: {
            marginLeft: spacing.sm,
            marginRight: spacing.sm,
          },
        },
      },
      MuiInput: {
        styleOverrides: {
          root: {
            'label+&': { marginTop: 10 },
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
        defaultProps: {
          // to keep from re-injecting styles in the head - slowing performance
          disableInjectingGlobalStyles: true,
        },
        styleOverrides: {
          root: {
            '& .MuiInputBase-input': {
              borderRadius: 0,
              height: '1.1876em',
            },
            '&.MuiFilledInput-root .MuiInputBase-input': {
              borderRadius: radius,
            },
          },
          input: {
            paddingTop: spacing.xxs,
            paddingBottom: spacing.xxs,
            borderRadius: radius,
          },
          adornedEnd: {
            // interferers with global search adornment
            // '&.MuiInputBase-adornedEnd svg': { marginRight: 0 },
            // '&.MuiInputBase-adornedEnd > *': { marginRight: spacing.md },
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
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            marginTop: spacing.xxs,
            marginBottom: spacing.xxs,
            '& .MuiSelect-iconStandard': { right: spacing.md },
            '& .MuiInputBase-sizeSmall': {
              height: 20,
              borderRadius: 10,
              fontSize: fontSizes.xxs,
              '& .MuiSelect-icon': { marginRight: 2 },
            },
            '& .MuiInputBase-hiddenLabel': { paddingTop: spacing.xxs, paddingBottom: spacing.xxs },
            '& .MuiSelect-filled.MuiInputBase-inputHiddenLabel.MuiFilledInput-input': { paddingRight: spacing.lg },
            '& .MuiSelect-filled.MuiInputBase-inputHiddenLabel.Mui-disabled': { paddingRight: spacing.sm },
            '& .MuiSelect-icon.Mui-disabled': { display: 'none' },
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
            // '& svg': { marginRight: spacing.xs }, // interfering with global search
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
        defaultProps: {
          disableInjectingGlobalStyles: true,
          IconComponent: ArrowIcon,
        },
        styleOverrides: {
          select: {
            '&:focus': { backgroundColor: 'inherit' },
          },
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
            '& > b': { fontWeight: 500 },
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
          subtitle2: {
            fontSize: fontSizes.xs,
            color: palette.grayDarkest.main,
            display: 'flex',
            alignItems: 'center',
            minHeight: spacing.lg,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
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
          gutterBottom: { marginBottom: spacing.md },
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
