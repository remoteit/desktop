import { colors, spacing, fontSizes } from './'
import { createMuiTheme, ThemeOptions } from '@material-ui/core'

const gutters = 32
const titlePadding = `${spacing.xxs}px ${gutters - 8}px ${spacing.xxs}px ${gutters}px`
const jssTheme: ThemeOptions = {
  palette: {
    primary: { main: colors.primary },
    secondary: { main: colors.secondary, contrastText: colors.white },
    error: { main: colors.danger },
  },
  typography: { fontFamily: 'Roboto, san-serif' },
  overrides: {
    MuiDivider: { root: { backgroundColor: colors.grayLighter } },
    MuiFormHelperText: { root: { fontSize: 10 } },
    MuiButton: {
      root: {
        color: colors.grayDark,
        borderRadius: spacing.xs,
        padding: `${spacing.sm - spacing.xxs}px ${spacing.md}px`,
        '&.MuiSvgIcon-root': { marginLeft: spacing.sm },
        '&+.MuiButton-root': { marginLeft: spacing.sm },
      },
      contained: {
        '&:hover': { backgroundColor: colors.grayDark },
        '&, &.Mui-disabled': { backgroundColor: colors.gray, color: colors.white },
      },
      text: { padding: `${spacing.sm}px ${spacing.md}px` },
      outlined: { borderColor: colors.grayLighter },
      sizeSmall: {
        fontSize: fontSizes.xs,
        fontWeight: 500,
        letterSpacing: 1,
        whiteSpace: 'nowrap',
        padding: `${spacing.xxs}px ${spacing.md}px`,
      },
    },
    MuiChip: {
      root: { borderRadius: 4, backgroundColor: colors.grayLightest },
      sizeSmall: { fontSize: fontSizes.xs },
    },
    MuiSnackbar: {
      root: { '& .MuiSnackbarContent-root': { flexWrap: 'nowrap' } },
      anchorOriginBottomCenter: { bottom: '80px !important' },
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
    MuiListSubheader: {
      root: {
        color: colors.grayDark,
        textTransform: 'uppercase',
        fontSize: fontSizes.xs,
        letterSpacing: 1,
        fontWeight: 500,
        lineHeight: '40px',
      },
    },
    MuiListItem: {
      root: {
        opacity: 1,
        paddingLeft: spacing.sm,
        paddingRight: spacing.sm,
        paddingTop: 5,
        paddingBottom: 5,
      },
      gutters: {
        paddingLeft: 9,
        paddingRight: 9,
      },
      button: {
        '&:hover, &:focus': { backgroundColor: colors.grayLightest },
      },
      container: {
        '& .MuiListItemSecondaryAction-root': {},
        '& .MuiListItemSecondaryAction-root.hidden': { display: 'none' },
        '&:hover, &:focus': {
          '& .MuiListItemSecondaryAction-root.hidden': { display: 'block' },
          '& .hoverHide': { display: 'none' },
        },
      },
      dense: {
        // paddingTop: '2px !important',
        // paddingBottom: '2px !important',
      },
    },
    MuiListItemSecondaryAction: { root: { right: gutters, zIndex: 2 } },
    MuiListItemIcon: { root: { justifyContent: 'center', minWidth: 65 } },
    MuiListItemText: {
      root: { zIndex: 1 },
      primary: { lineHeight: 1.4 },
      secondary: { fontSize: fontSizes.xs },
    },
    MuiTableCell: {
      root: {
        borderBottomWidth: 0,
        paddingLeft: 0,
        paddingRight: spacing.xs,
      },
      head: {
        borderBottom: 1,
      },
    },
    MuiMenu: {
      list: {
        backgroundColor: colors.grayLightest,
        '& .MuiMenuItem-dense': { paddingTop: '2px !important', paddingBottom: '2px !important' },
        '& > .MuiList-padding': { padding: 0 },
      },
    },
    MuiMenuItem: {
      root: {
        '& .MuiListItemIcon-root': { minWidth: 50 },
        '&:hover, &:focus': { backgroundColor: colors.grayLighter },
      },
    },
    MuiInput: {
      root: {
        '&.Mui-disabled': {
          color: colors.grayDarker,
          '& svg': { display: 'none' },
        },
      },
      underline: { '&.Mui-disabled:before': { borderColor: colors.grayLight } },
    },
    MuiInputLabel: {
      shrink: {
        fontSize: fontSizes.sm,
        color: colors.grayDark,
        letterSpacing: 0.5,
        fontWeight: 500,
        textTransform: 'uppercase',
      },
      filled: { pointerEvents: 'auto' },
    },
    MuiFilledInput: {
      root: {
        backgroundColor: colors.grayLightest,
        '&$focused': { backgroundColor: colors.primaryHighlight },
        '&.Mui-disabled': { backgroundColor: colors.grayLightest },
        '&:hover': { backgroundColor: colors.primaryHighlight },
        '&:focused': { backgroundColor: colors.primaryHighlight },
      },
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
          backgroundColor: colors.grayLightest,
          borderRadius: 10,
          textDecoration: 'none',
          cursor: 'pointer',
        },
      },
    },
    MuiTypography: {
      gutterBottom: { marginBottom: spacing.md },
      h1: {
        fontSize: fontSizes.lg,
        fontWeight: 400,
        display: 'flex',
        alignItems: 'center',
        padding: titlePadding,
        minHeight: 50,
        color: colors.grayDarkest,
        letterSpacing: -0.2,
        '& span + span': { marginLeft: spacing.lg },
      },
      h2: {
        fontSize: fontSizes.md,
        fontWeight: 400,
      },
      h4: {
        fontSize: fontSizes.sm,
        fontFamily: 'Roboto Mono',
        color: colors.grayDark,
        marginTop: spacing.xs,
        marginBottom: spacing.sm,
      },
      subtitle1: {
        fontSize: fontSizes.sm,
        fontFamily: 'Roboto Mono',
        color: colors.grayDark,
        display: 'flex',
        alignItems: 'flex-end',
        minHeight: 50,
        padding: titlePadding,
        textTransform: 'uppercase',
        letterSpacing: 3,
        fontWeight: 500,
      },
      body2: {
        fontSize: fontSizes.base,
      },
      caption: {
        fontSize: fontSizes.xs,
        color: colors.grayDark,
        lineHeight: '1.5em',
        '& b': { color: colors.grayDarkest, fontWeight: 400 },
      },
      colorTextSecondary: {
        color: colors.grayDark,
      },
    },
    MuiDialogTitle: { root: { margin: `${spacing.lg}px ${gutters}px 0`, padding: 0 } },
    MuiDialogContent: { root: { margin: `${spacing.sm}px ${gutters}px`, padding: 0 } },
    MuiDialogActions: { root: { margin: `${spacing.sm}px ${spacing.md}px`, padding: 0 } },
    MuiTooltip: { tooltip: { '& .MuiDivider-root': { margin: `${spacing.xxs}px -${spacing.sm}px`, opacity: 0.2 } } },
  },
}

export default createMuiTheme(jssTheme)
