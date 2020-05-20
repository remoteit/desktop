import { colors, spacing, fontSizes } from './'
import { createMuiTheme } from '@material-ui/core'

const gutters = 28
export default createMuiTheme({
  palette: {
    primary: { main: colors.primary },
    secondary: { main: colors.secondary },
    error: { main: colors.danger },
  },
  typography: { fontFamily: 'Roboto, san-serif' },
  overrides: {
    MuiListItemText: { secondary: { fontSize: fontSizes.xs } },
    MuiDivider: { root: { backgroundColor: colors.grayLighter } },
    MuiFormHelperText: { root: { fontSize: 10 } },
    MuiButton: {
      root: {
        color: colors.grayDark,
        borderRadius: spacing.xs,
        backgroundColor: colors.grayLightest,
        padding: `${spacing.sm - spacing.xxs}px ${spacing.md}px`,
        '& .MuiSvgIcon-root': { marginLeft: spacing.sm },
      },
      contained: {},
      text: { padding: `${spacing.sm}px ${spacing.md}px` },
      outlined: { borderColor: colors.grayLighter },
    },
    MuiChip: {
      root: { borderRadius: 4, backgroundColor: colors.grayLighter },
    },
    MuiSnackbar: {
      root: { '& .MuiSnackbarContent-root': { flexWrap: 'nowrap' } },
      anchorOriginBottomCenter: { bottom: '80px !important' },
    },
    MuiListItem: {
      root: { opacity: 1 },
      button: {
        paddingLeft: spacing.sm,
        paddingRight: spacing.sm,
        '&:hover, &:focus': { backgroundColor: colors.grayLightest },
      },
      container: {
        '& .MuiListItemSecondaryAction-root': {},
        '&:hover, &:focus': {
          '& .MuiListItemSecondaryAction-root.hidden': { display: 'block' },
          '& .hoverHide': { display: 'none' },
        },
      },
    },
    MuiListItemSecondaryAction: { root: { right: gutters } },
    MuiListItemIcon: { root: { justifyContent: 'center', minWidth: 65 } },
    MuiInput: {
      root: {
        '&.Mui-disabled': {
          color: colors.grayDarker,
          '& svg': { display: 'none' },
        },
      },
      underline: { '&.Mui-disabled:before': { borderColor: colors.grayLight } },
    },
    MuiFilledInput: {
      root: {
        backgroundColor: colors.grayLightest,
        '&.Mui-disabled': { backgroundColor: colors.grayLightest },
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
        fontSize: '1rem',
        fontWeight: 400,
        display: 'flex',
        alignItems: 'center',
        padding: `${spacing.xxs}px ${gutters}px`,
        borderBottom: `1px solid ${colors.grayLighter}`,
        minHeight: 50,
        '& span + span': { marginLeft: spacing.md },
      },
      h2: {
        fontSize: '1rem',
        fontWeight: 400,
      },
      h4: {
        fontSize: fontSizes.sm,
        fontFamily: 'Roboto Mono',
        color: colors.grayDarker,
        marginTop: spacing.xs,
        marginBottom: spacing.sm,
      },
      subtitle1: {
        fontSize: fontSizes.sm,
        fontFamily: 'Roboto Mono',
        color: colors.gray,
        padding: `${spacing.lg}px ${spacing.sm}px 0 ${gutters}px`,
        marginLeft: spacing.xxs,
        textTransform: 'uppercase',
        letterSpacing: 3,
        fontWeight: 500,
      },
      body2: {
        fontSize: fontSizes.base,
      },
      caption: {
        fontSize: '11px',
        color: colors.grayDark,
        lineHeight: '1.5em',
      },
      colorTextSecondary: {
        color: colors.grayDark,
      },
    },
    MuiDialogContent: { root: { margin: `${spacing.md}px ${gutters}px`, padding: 0 } },
    MuiDialogActions: { root: { margin: `${spacing.md}px ${gutters}px`, padding: 0 } },
  },
})
