import React from 'react'
import { Icon } from './Icon'
import { IconButton } from '../buttons/IconButton'
import { spacing, fontSizes } from '../styling'
import { alpha, Paper, Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import classnames from 'classnames'

export type NoticeProps = {
  severity?: 'info' | 'warning' | 'error' | 'success'
  button?: React.ReactNode
  gutterTop?: boolean
  gutterBottom?: boolean
  fullWidth?: boolean
  loading?: boolean
  solid?: boolean
  onClose?: () => void
  iconOverride?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export const Notice: React.FC<NoticeProps> = ({
  severity = 'info',
  button,
  fullWidth = false,
  gutterTop,
  gutterBottom,
  loading,
  solid,
  onClose,
  iconOverride,
  className,
  children,
}) => {
  const css = useStyles({ fullWidth, gutterBottom, gutterTop })
  let iconName: string

  switch (severity) {
    case 'info':
      iconName = 'info-circle'
      break
    case 'error':
      iconName = 'exclamation-triangle'
      break
    case 'warning':
      iconName = 'exclamation-triangle'
      break
    case 'success':
      iconName = 'check-circle'
      break
  }

  let icon: React.ReactNode = <Icon name={iconName} size="md" type="regular" />
  if (iconOverride) icon = iconOverride
  if (loading) icon = <Icon name="spinner-third" spin size="md" fixedWidth />

  return (
    <Paper elevation={0} className={classnames(className, css.notice, css[solid ? severity + 'Solid' : severity])}>
      {icon}
      <Box>{children}</Box>
      {button}
      {onClose && <IconButton name="times" onClick={onClose} color={solid ? 'alwaysWhite' : undefined} title="Close" />}
    </Paper>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  info: { color: palette.primary.main, backgroundColor: alpha(palette.primary.main, 0.1) },
  error: { color: palette.error.main, backgroundColor: alpha(palette.error.main, 0.1) },
  warning: { color: palette.warning.main, backgroundColor: alpha(palette.warning.main, 0.1) },
  success: { color: palette.success.main, backgroundColor: alpha(palette.success.main, 0.1) },
  infoSolid: { color: palette.alwaysWhite.main, backgroundColor: palette.primary.main },
  errorSolid: { color: palette.alwaysWhite.main, backgroundColor: palette.error.main },
  warningSolid: { color: palette.alwaysWhite.main, backgroundColor: palette.warning.main },
  successSolid: { color: palette.alwaysWhite.main, backgroundColor: palette.success.main },
  notice: ({ fullWidth, gutterBottom, gutterTop }: NoticeProps) => ({
    flexGrow: 1,
    alignItems: 'flex-start',
    marginLeft: fullWidth ? 0 : spacing.md,
    marginRight: fullWidth ? 0 : spacing.md,
    marginBottom: gutterBottom ? spacing.md : 0,
    marginTop: gutterTop ? spacing.md : 0,
    padding: `${spacing.sm}px ${spacing.md}px`,
    display: 'flex',
    position: 'relative',
    fontWeight: 500,
    '& > .MuiBox-root': {
      flexGrow: 1,
      marginTop: spacing.xxs,
      marginRight: spacing.xs,
      minHeight: 34,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    '& > .MuiIconButton-root': { marginLeft: spacing.sm },
    '& > svg': {
      marginLeft: spacing.xxs,
      marginRight: spacing.md,
      width: 21,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    '& em': { display: 'block', fontWeight: 400, fontSize: fontSizes.sm, fontStyle: 'normal' },
    '& strong': { fontSize: fontSizes.base, fontWeight: 500 },
  }),
}))
