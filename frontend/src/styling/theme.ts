import { colors, spacing, radius, fontSizes } from './'
import { createMuiTheme, ThemeOptions } from '@material-ui/core'

const gutters = 32
const jssTheme: ThemeOptions = {
  palette: {
    primary: { main: colors.primary },
    secondary: { main: colors.secondary, contrastText: colors.white },
    error: { main: colors.danger },
  },
  typography: {
    fontFamily: "'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  },
  overrides: {
    MuiDivider: {
      root: { backgroundColor: colors.grayLighter, '&.MuiDivider-flexItem': { height: 1 } },
      inset: { marginRight: spacing.md, marginLeft: spacing.md },
    },
    MuiAccordion: {
      root: {
        '&.Mui-expanded': { margin: 0 },
        '&:before': { display: 'none' },
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
        color: colors.grayDark,
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
        '&:hover': { backgroundColor: colors.grayDark },
        '&, &.Mui-disabled': { backgroundColor: colors.gray, color: colors.white },
        boxShadow: 'none',
      },
      text: { padding: `${spacing.sm}px ${spacing.md}px` },
      outlined: { borderColor: colors.grayLighter },
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
      ripple: { color: colors.primary },
    },
    MuiChip: {
      root: { borderRadius: radius, backgroundColor: colors.grayLightest },
      clickable: {
        '&:hover, &:focus': { backgroundColor: colors.primaryLighter },
      },
      sizeSmall: {
        height: 20,
        borderRadius: 10,
        fontSize: fontSizes.xxs,
        paddingLeft: spacing.xxs,
        paddingRight: spacing.xxs,
        '& + .MuiChip-sizeSmall': { marginLeft: spacing.xxs },
      },
      outlined: {
        borderColor: colors.grayLighter,
        color: colors.grayDarker,
      },
    },
    MuiSnackbar: {
      root: { '& .MuiSnackbarContent-root': { flexWrap: 'nowrap' } },
      anchorOriginBottomCenter: { bottom: '80px !important' },
    },
    MuiSnackbarContent: {
      root: { borderRadius: radius },
    },
    MuiCardHeader: {
      root: {
        paddingTop: spacing.xs,
        paddingBottom: spacing.xs,
        color: colors.white,
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
        fontSize: fontSizes.xxs,
        lineHeight: '40px',
      },
      sticky: { zIndex: 2 },
      gutters: {
        paddingRight: gutters - 8,
        paddingLeft: gutters,
      },
    },
    MuiPaper: {
      rounded: { borderRadius: radius },
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
        '&.Mui-selected': { backgroundColor: colors.primaryHighlight },
        '&.Mui-selected:hover': { backgroundColor: colors.primaryLighter },
      },
      gutters: {
        width: `calc(100% - ${spacing.md * 2}px)`,
        paddingLeft: spacing.xxs,
        paddingRight: spacing.xxs,
        marginLeft: spacing.md,
        marginRight: spacing.md,
      },
      button: {
        // '&:hover, &:focus': { backgroundColor: colors.primaryHighlight },
        '&:hover': { backgroundColor: colors.primaryHighlight },
      },
      secondaryAction: { paddingRight: 60 },
      container: {
        '& .MuiListItemSecondaryAction-root': {},
        '& .MuiListItemSecondaryAction-root.hidden': { display: 'none' },
        // '&:hover, &:focus': {
        '&:hover': {
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
    MuiListItemIcon: { root: { justifyContent: 'center', minWidth: 60, color: colors.grayDark } },
    MuiListItemText: {
      root: { zIndex: 1 },
      primary: { lineHeight: 1.4 },
      secondary: { fontSize: fontSizes.xs },
    },
    MuiMenu: {
      list: {
        backgroundColor: colors.grayLightest,
        '& .MuiListItem-dense': {
          marginLeft: spacing.xs,
          width: `calc(100% - ${spacing.xs * 2}px)`,
          whiteSpace: 'nowrap',
        },
        '& .MuiMenuItem-dense': { paddingTop: '2px !important', paddingBottom: '2px !important' },
        '& > .MuiList-padding': { padding: 0 },
      },
    },
    MuiMenuItem: {
      root: {
        '& .MuiListItemIcon-root': { minWidth: 50 },
        color: colors.grayDarkest,
        paddingLeft: spacing.sm,
        paddingRight: spacing.sm,
        marginLeft: spacing.sm,
        marginRight: spacing.sm,
        // '&:hover, &:focus': { backgroundColor: colors.grayLighter },
        '&:hover, &:focus': { backgroundColor: colors.primaryLighter },
      },
    },
    MuiInput: {
      root: {
        '&.Mui-disabled': {
          color: colors.grayDarker,
          '& svg': { display: 'none' },
        },
      },
      underline: {
        '&.Mui-disabled:before': { borderColor: colors.grayLight },
        '&:before, &:after': { display: 'none' },
      },
    },
    MuiInputLabel: {
      shrink: {
        fontSize: fontSizes.sm,
        color: colors.grayDark,
        letterSpacing: 0.5,
        fontWeight: 500,
        textTransform: 'uppercase',
      },
    },
    MuiFilledInput: {
      root: {
        backgroundColor: colors.grayLightest,
        borderTopLeftRadius: radius,
        borderBottomLeftRadius: radius,
        borderTopRightRadius: radius,
        borderBottomRightRadius: radius,
        '&$focused': { backgroundColor: colors.primaryHighlight },
        '&.Mui-disabled': { backgroundColor: colors.grayLightest },
        '&:hover': { backgroundColor: colors.primaryHighlight },
        '&:focused': { backgroundColor: colors.primaryHighlight },
      },
      input: { padding: '22px 12px 10px' },
      underline: {
        '&:before, &:after': { display: 'none' },
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
          backgroundColor: colors.primaryHighlight,
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
        color: colors.grayDarkest,
        letterSpacing: -0.2,
      },
      h2: {
        fontSize: fontSizes.md,
        fontWeight: 400,
      },
      h4: {
        fontSize: fontSizes.sm,
        fontFamily: "'Roboto Mono'",
        color: colors.grayDark,
        marginTop: spacing.xs,
        marginBottom: spacing.sm,
      },
      subtitle1: {
        fontSize: fontSizes.xxs,
        color: colors.grayDarker,
        display: 'flex',
        alignItems: 'flex-end',
        minHeight: 50,
        padding: `${spacing.xxs}px ${gutters - 8}px ${spacing.xxs}px ${gutters}px`,
        textTransform: 'uppercase',
        letterSpacing: 2,
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
        '& b': { color: colors.grayDarkest, fontWeight: 400 },
      },
    },
    MuiDialogTitle: { root: { margin: `${spacing.lg}px ${gutters}px 0`, padding: 0 } },
    MuiDialogContent: { root: { margin: `${spacing.sm}px ${gutters}px`, padding: 0 } },
    MuiDialogActions: { root: { margin: `${spacing.sm}px ${spacing.md}px`, padding: 0 } },
    MuiTooltip: { tooltip: { '& .MuiDivider-root': { margin: `${spacing.xxs}px -${spacing.sm}px`, opacity: 0.2 } } },
    MuiTableCell: {
      root: { padding: `${spacing.xs}px ${gutters}px`, borderBottom: `1px solid ${colors.grayLighter}` },
    },
  },
}

export default createMuiTheme(jssTheme)
