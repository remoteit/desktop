import React from 'react'
import { Icon } from './Icon'
import { spacing, fontSizes } from '../styling'
import { Paper, Box } from '@material-ui/core'
import { makeStyles, alpha } from '@material-ui/core/styles'
import classnames from 'classnames'

type Props = {
  severity?: 'info' | 'warning' | 'danger' | 'success'
  button?: React.ReactElement
  gutterTop?: boolean
  gutterBottom?: boolean
  fullWidth?: boolean
  loading?: boolean
}

export const Notice: React.FC<Props> = ({
  severity = 'info',
  button,
  fullWidth = false,
  gutterTop,
  gutterBottom,
  loading,
  children,
}) => {
  const css = useStyles({ fullWidth, gutterBottom, gutterTop })
  let icon

  switch (severity) {
    case 'info':
      icon = 'info-circle'
      break
    case 'danger':
      icon = 'exclamation-triangle'
      break
    case 'warning':
      icon = 'exclamation-triangle'
      break
    case 'success':
      icon = 'check-circle'
      break
  }

  return (
    <Paper elevation={0} className={classnames(css.notice, css[severity])}>
      {loading ? (
        <Icon name="spinner-third" spin size="md" fixedWidth />
      ) : (
        <Icon name={icon} size="md" type="regular" />
      )}
      <Box>{children}</Box>
      {button}
    </Paper>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  info: { color: palette.primary.main, backgroundColor: alpha(palette.primary.main, 0.1) },
  danger: { color: palette.danger.main, backgroundColor: alpha(palette.danger.main, 0.1) },
  warning: { color: palette.warning.main, backgroundColor: alpha(palette.warning.main, 0.1) },
  success: { color: palette.success.main, backgroundColor: alpha(palette.success.main, 0.1) },
  notice: ({ fullWidth, gutterBottom, gutterTop }: Props) => ({
    flexGrow: 1,
    alignItems: 'center',
    margin: `0 ${fullWidth ? 0 : spacing.md}px`,
    marginBottom: gutterBottom ? spacing.md : 0,
    marginTop: gutterTop ? spacing.md : 0,
    padding: `${spacing.sm}px ${spacing.md}px`,
    display: 'flex',
    fontWeight: 500,
    '& .MuiBox-root': { flexGrow: 1, marginTop: spacing.xxs, marginRight: spacing.xs },
    '& .MuiButton-root': { minWidth: 90, marginLeft: spacing.md },
    '& .MuiIconButton-root': { marginLeft: spacing.sm },
    '& > svg': { marginLeft: spacing.xxs, marginRight: spacing.md, width: 21 },
    '& em': { display: 'block', fontWeight: 400, fontSize: fontSizes.sm, fontStyle: 'normal' },
  }),
}))
