import browser from '../services/browser'
import { lightColors, darkColors, spacing, radius, fontSizes } from './'
import { createTheme, Theme, ThemeOptions, PaletteOptions, ComponentsOverrides } from '@mui/material/styles'
import { ArrowIcon } from '../components/ArrowIcon'
import { State } from '../store'

declare module '@mui/styles' {
  interface DefaultTheme extends Theme {}
}

export const jssTheme = (isDark: boolean): ThemeOptions => {
  const colors = isDark ? darkColors : lightColors
  const LIST_ITEM_ICON_WIDTH = 56

  if (!browser.isApple) {
    radius.sm = 4
    radius.lg = 4
  }

  const palette = {
    mode: isDark ? 'dark' : 'light',
    info: { main: colors.grayDark },
    action: { hover: colors.hover },
    primary: { main: colors.primary, dark: colors.primaryDark },
    // secondary: { main: '#F0F', contrastText: colors.white }, // this can later become the reseller editable color
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
    shadow: { main: colors.shadow },
    rpi: { main: colors.rpi },
    guide: { main: colors.guide },
    test: { main: colors.test },
  }

  const ListItemStyles: ComponentsOverrides<Theme>['MuiListItemButton'] & ComponentsOverrides<Theme>['MuiListItem'] = {
    root: {
      opacity: 1,
      marginTop: 1,
      marginBottom: 1,
      borderRadius: radius.sm,
      padding: `5px 0px`,
      '&.Mui-selected': { backgroundColor: palette.primaryHighlight.main },
      '&.Mui-selected:hover': { backgroundColor: palette.primaryLighter.main },
      '& > .hidden, & > div > .hidden': { opacity: 0, transition: 'opacity 200ms 100ms' },
      '& > .hoverHide, & > div > .hoverHide': { opacity: 1, transition: 'opacity 400ms' },
      '&:hover': {
        '& > .hidden, & > div > .hidden': { opacity: 1 },
        '& > .hoverHide, & > div > .hoverHide': { opacity: 0 },
      },
    },
    gutters: {
      width: `calc(100% - ${spacing.md * 2}px)`,
      marginLeft: spacing.md,
      marginRight: spacing.md,
    },
    dense: {
      '& .MuiInputBase-root': { fontSize: fontSizes.base },
      '& .MuiFormHelperText-contained': { marginTop: 0, marginBottom: spacing.xs },
    },
  }

  return {
    palette: palette as PaletteOptions,
    typography: {
      fontFamily: "'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    },
    // breakpoints: { @TODO: move arbitrary breakpoints to theme
    //   values: {
    //     xs: 0,
    //     sm: 600, // 500 mobile?
    //     md: 960,
    //     lg: 1280,
    //     xl: 1920, // 1800 max?
    //   },
    // },
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
          root: { borderColor: palette.action.hover, '&.MuiDivider-flexItem': { height: 1 } },
          inset: { marginRight: spacing.lg, marginLeft: spacing.lg },
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
            borderRadius: `${radius.lg}px !important`,
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
          root: { borderRadius: radius.sm, padding: spacing.sm },
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
            borderRadius: radius.sm,
            fontWeight: 700,
            letterSpacing: 1.5,
            whiteSpace: 'nowrap',
            fontSize: fontSizes.xs,
            padding: `${spacing.sm}px ${spacing.md}px`,
            '&.MuiSvgIcon-root': { marginLeft: spacing.sm },
          },
          containedPrimary: {
            '&:hover': { backgroundColor: palette.primary.dark },
          },
          contained: {
            color: palette.alwaysWhite.main,
            '&:hover': { backgroundColor: palette.grayDarkest.main },
            '&:hover.Mui-disabled, &.Mui-disabled': {
              backgroundColor: palette.gray.main,
              color: palette.alwaysWhite.main,
            },
          },
          text: { padding: `${spacing.sm}px ${spacing.md}px` },
          outlined: { padding: `${spacing.sm}px ${spacing.md}px`, borderColor: palette.grayLighter.main },
          sizeLarge: {
            fontSize: fontSizes.sm,
            padding: `${spacing.sm}px ${spacing.lg}px`,
            borderRadius: radius.lg + radius.sm,
          },
          fullWidth: {
            '&.MuiButton-sizeLarge': {
              width: `calc(100% + ${spacing.md}px)`,
              marginLeft: -spacing.md / 2,
              marginRight: -spacing.md / 2,
            },
          },
          sizeSmall: {
            borderRadius: radius.lg,
            fontSize: fontSizes.xxs,
            padding: `${spacing.xs}px ${spacing.md}px`,
            minWidth: spacing.xxl,
          },
        },
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            borderRadius: radius.sm,
            WebkitAppRegion: 'no-drag',
            '& .MuiTouchRipple-root': { color: palette.primary.main },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            color: palette.grayDarker.main,
            borderRadius: radius.lg,
            backgroundColor: palette.grayLightest.main,
            textTransform: 'initial',
            '& .MuiChip-icon': { color: 'inherit', marginLeft: 8 },
          },
          clickable: {
            '&:hover': { backgroundColor: palette.primaryLighter.main },
            '&.MuiChip-colorPrimary:hover': { backgroundColor: palette.grayDarker.main },
            '&.MuiChip-colorPrimary:focus': { backgroundColor: palette.primary.main },
          },
          colorPrimary: {
            color: palette.alwaysWhite.main,
            backgroundColor: palette.primary.main,
          },
          sizeSmall: {
            height: 20,
            fontWeight: 400,
            color: 'inherit',
            fontSize: fontSizes.xs,
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
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 0,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              width: spacing.lg,
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 7,
              pointerEvents: 'none',
              backgroundImage: `linear-gradient(90deg, transparent, ${palette.white.main})`,
            },
          },
          flexContainer: {
            // Adding space to end of tabs to allow for fade
            '&::after': {
              content: '""',
              minWidth: spacing.md,
            },
          },
          scrollButtons: {
            color: palette.grayDark.main,
            '&.Mui-disabled': { opacity: 0.2 },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            borderRadius: radius.sm,
            minWidth: 0,
            minHeight: 0,
            textTransform: 'initial',
            fontWeight: 400,
            fontSize: fontSizes.xs,
            padding: `${spacing.xs}px ${spacing.sm}px`,
            color: palette.grayDark.main,
            '&:hover': { backgroundColor: palette.grayLighter.main, color: palette.grayDarkest.main },
            '&.Mui-selected': {
              backgroundColor: palette.primaryHighlight.main,
              fontWeight: 500,
              '&:hover': { color: palette.primary.main },
            },
          },
        },
      },
      MuiSnackbarContent: {
        styleOverrides: {
          root: {
            borderRadius: radius.lg,
            flexWrap: 'nowrap',
            padding: 0,
            '& .MuiSnackbarContent-message': { padding: 0 },
          },
          message: {
            width: '100%',
          },
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
            fontSize: fontSizes.xxs,
            color: palette.white.main,
            letterSpacing: 0.5,
          },
          action: {
            fontSize: fontSizes.xxs,
            marginTop: 1,
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
            marginLeft: spacing.md,
            marginRight: spacing.md,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: radius.sm },
          root: { backgroundColor: palette.white.main, backgroundImage: 'none' },
        },
      },
      MuiListItem: {
        styleOverrides: {
          ...ListItemStyles,
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          ...ListItemStyles,
        },
      },
      MuiListItemSecondaryAction: {
        defaultProps: {
          onMouseDown: (event: React.MouseEvent) => {
            event.stopPropagation()
            event.preventDefault()
          },
          onClick: (event: React.MouseEvent) => {
            event.stopPropagation()
          },
        },
        styleOverrides: {
          root: {
            zIndex: 2,
            right: spacing.md,
            '& .MuiTextField-root': { verticalAlign: 'middle' },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: { justifyContent: 'center', minWidth: LIST_ITEM_ICON_WIDTH, color: palette.grayDark.main },
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
            '& .MuiListItemButton-dense, & .MuiMenuItem-dense': {
              width: `calc(100% - ${spacing.xs * 2}px)`,
              marginLeft: spacing.xs,
              marginRight: spacing.xs,
              paddingRight: spacing.sm,
              paddingLeft: spacing.xs,
              whiteSpace: 'nowrap',
              '& .MuiListItemText-root': { paddingRight: spacing.md },
              '& .MuiListItemIcon-root': { minWidth: LIST_ITEM_ICON_WIDTH },
            },
            '& .MuiMenuItem-dense': { paddingTop: '2px !important', paddingBottom: '2px !important' },
            '& > .MuiList-padding': { padding: 0 },
            '& .MuiListItemIcon-root': { minWidth: LIST_ITEM_ICON_WIDTH },
            '& .MuiListItemSecondaryAction-root': { right: spacing.sm },
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
              borderRadius: radius.sm,
            },
            '& .MuiInputBase-inputSizeSmall': {
              paddingTop: spacing.xxs,
              paddingBottom: spacing.xxs,
            },
          },
          input: {
            paddingTop: spacing.xxs,
            paddingBottom: spacing.xxs,
            borderRadius: radius.sm,
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
        defaultProps: {
          onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key === '#') event.stopPropagation()
          },
        },
        styleOverrides: {
          root: {
            '& .MuiSelect-iconStandard': { right: spacing.md },
            '& .MuiInputBase-sizeSmall': {
              marginTop: spacing.xxs,
              marginBottom: spacing.xxs,
              height: 20,
              borderRadius: radius.sm * 1.25,
              '& .MuiSelect-select': { fontSize: fontSizes.xxs },
              '& .MuiSelect-icon': { marginRight: 2 },
            },
            '& .MuiInputBase-hiddenLabel': { paddingTop: spacing.xxs, paddingBottom: spacing.xxs },
            '& .MuiSelect-filled.MuiInputBase-inputHiddenLabel.MuiFilledInput-input': {
              paddingRight: spacing.lg,
              '&.Mui-disabled': { WebkitTextFillColor: 'inherit' },
            },
            '& .MuiSelect-filled.MuiInputBase-inputHiddenLabel.Mui-disabled': { paddingRight: spacing.sm },
            '& .MuiSelect-icon.Mui-disabled': { display: 'none' },
            '& .MuiSelect-icon': { marginRight: spacing.xs },
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            padding: 0,
            borderTopLeftRadius: radius.sm,
            borderBottomLeftRadius: radius.sm,
            borderTopRightRadius: radius.sm,
            borderBottomRightRadius: radius.sm,
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
          root: { borderRadius: radius.sm },
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
              borderRadius: radius.sm,
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
            fontWeight: 500,
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
            fontFamily: "'Roboto Mono', Roboto",
            color: palette.grayDark.main,
            marginTop: spacing.xs,
            marginBottom: spacing.sm,
          },
          h5: {
            fontSize: fontSizes.xxs, //'0.5625rem', // inputLabel shrink (12px * 0.75 || 9px)
            letterSpacing: 0.5,
            fontWeight: 500,
            textTransform: 'uppercase',
          },
          subtitle1: {
            fontFamily: "'Roboto Mono', Roboto",
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
            fontFamily: "'Roboto Mono', Roboto",
            fontSize: fontSizes.xxs,
            color: palette.grayDarkest.main,
            display: 'flex',
            alignItems: 'center',
            minHeight: spacing.lg,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            fontWeight: 500,
          },
          body1: {
            fontSize: fontSizes.md,
            '& b': { fontWeight: 500, color: palette.grayDarker.main },
          },
          body2: {
            fontSize: fontSizes.base,
            '& b': { fontWeight: 500 },
          },
          caption: {
            fontSize: fontSizes.sm,
            color: palette.grayDark.main,
            lineHeight: '1.25em',
            '& b': { color: palette.grayDarkest.main, fontWeight: 400 },
          },
          gutterBottom: { marginBottom: spacing.md },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { margin: `${spacing.lg}px ${spacing.xl}px 0`, padding: 0, lineHeight: '1.1em' },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { margin: `${spacing.sm}px ${spacing.xl}px`, padding: 0 },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { margin: `0 ${spacing.md}px ${spacing.sm}px`, padding: 0 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            '& .MuiDivider-root': { margin: `${spacing.xxs}px 0`, borderColor: palette.alwaysWhite.main, opacity: 0.3 },
          },
        },
        defaultProps: {
          enterTouchDelay: 200,
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${palette.grayLighter.main}`,
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: { backgroundColor: palette.white.main },
        },
      },
    },
  }
}

export function getTheme(isDark: boolean) {
  console.log('SELECT THEME. DARK MODE:', isDark)
  const theme = createTheme(jssTheme(isDark))
  return theme
}

export function isDarkMode(themeMode?: State['ui']['themeMode']) {
  let darkMode = window?.matchMedia && window?.matchMedia('(prefers-color-scheme: dark)').matches
  if (themeMode === 'dark') darkMode = true
  if (themeMode === 'light') darkMode = false
  return darkMode
}
