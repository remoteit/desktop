import React from 'react'
import { Icon } from './Icon'
import { IconButton } from '../buttons/IconButton'
import { spacing, fontSizes } from '../styling'
import { alpha, Paper, Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import classnames from 'classnames'

type Props = {
  severity?: 'info' | 'warning' | 'danger' | 'success'
  button?: React.ReactNode
  gutterTop?: boolean
  gutterBottom?: boolean
  fullWidth?: boolean
  loading?: boolean
  solid?: boolean
  onClose?: () => void
  className?: React.ReactNode
  children?: React.ReactNode
}

export const Notice: React.FC<Props> = ({
  severity = 'info',
  button,
  fullWidth = false,
  gutterTop,
  gutterBottom,
  loading,
  solid,
  onClose,
  className,
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
    <Paper elevation={0} className={classnames(className, css.notice, css[solid ? severity + 'Solid' : severity])}>
      {loading ? (
        <Icon name="spinner-third" spin size="md" fixedWidth />
      ) : (
        <Icon name={icon} size="md" type="regular" />
      )}
      <Box>{children}</Box>
      {button}
      {onClose && <IconButton name="times" onClick={onClose} title="Close" />}
    </Paper>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  info: { color: palette.primary.main, backgroundColor: alpha(palette.primary.main, 0.1) },
  danger: { color: palette.danger.main, backgroundColor: alpha(palette.danger.main, 0.1) },
  warning: { color: palette.warning.main, backgroundColor: alpha(palette.warning.main, 0.1) },
  success: { color: palette.success.main, backgroundColor: alpha(palette.success.main, 0.1) },
  infoSolid: { color: palette.alwaysWhite.main, backgroundColor: palette.primary.main },
  dangerSolid: { color: palette.alwaysWhite.main, backgroundColor: palette.danger.main },
  warningSolid: { color: palette.alwaysWhite.main, backgroundColor: palette.warning.main },
  successSolid: { color: palette.alwaysWhite.main, backgroundColor: palette.success.main },
  notice: ({ fullWidth, gutterBottom, gutterTop }: Props) => ({
    flexGrow: 1,
    alignItems: 'center',
    marginLeft: fullWidth ? 0 : spacing.md,
    marginRight: fullWidth ? 0 : spacing.md,
    marginBottom: gutterBottom ? spacing.md : 0,
    marginTop: gutterTop ? spacing.md : 0,
    padding: `${spacing.sm}px ${spacing.md}px`,
    display: 'flex',
    fontWeight: 500,
    '& .MuiBox-root': { flexGrow: 1, marginTop: spacing.xxs, marginRight: spacing.xs },
    '& .MuiButton-root': { minWidth: 90, marginLeft: spacing.md },
    '& > .MuiIconButton-root': { marginLeft: spacing.sm },
    '& > svg': { marginLeft: spacing.xxs, marginRight: spacing.md, width: 21 },
    '& em': { display: 'block', fontWeight: 400, fontSize: fontSizes.sm, fontStyle: 'normal' },
    '& strong': { fontSize: fontSizes.base, fontWeight: 500 },
  }),
}))
