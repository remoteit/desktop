import React from 'react'
import { Icon } from './Icon'
import { IconButton } from '../buttons/IconButton'
import { spacing, fontSizes } from '../styling'
import { alpha, SxProps, Theme, Paper, Box } from '@mui/material'
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
  invert?: boolean
  onClose?: () => void
  closeTitle?: string
  iconOverride?: React.ReactNode
  className?: string
  sx?: SxProps<Theme>
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
  invert,
  onClose,
  closeTitle = 'Close',
  iconOverride,
  className,
  sx,
  children,
}) => {
  const css = useStyles({ fullWidth, gutterBottom, gutterTop })
  let iconName: string
  let iconColor: string = severity

  switch (severity) {
    case 'info':
      iconName = 'info-circle'
      iconColor = 'calm'
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

  let icon: React.ReactNode = <Icon name={iconName} color={invert ? iconColor : undefined} size="md" type="regular" />
  if (iconOverride) icon = iconOverride
  if (loading) icon = <Icon name="spinner-third" spin size="md" fixedWidth />

  return (
    <Paper
      sx={sx}
      elevation={0}
      className={classnames(className, css.notice, css[solid ? severity + 'Solid' : severity])}
    >
      {icon}
      <Box
        sx={{
          flexGrow: 1,
          marginY: 1.3,
          marginRight: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          wordBreak: 'break-word',
          color: invert ? 'white.main' : undefined,
        }}
      >
        <span>{children}</span>
      </Box>
      {button}
      {onClose && (
        <IconButton
          name="times"
          onClick={onClose}
          sx={{ marginRight: -1 }}
          color={solid ? 'alwaysWhite' : invert ? 'grayLight' : undefined}
          title={closeTitle}
        />
      )}
    </Paper>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  info: { color: palette.info.main, backgroundColor: alpha(palette.info.main, 0.1) },
  error: { color: palette.error.main, backgroundColor: alpha(palette.error.main, 0.1) },
  warning: { color: palette.warning.main, backgroundColor: alpha(palette.warning.main, 0.1) },
  success: { color: palette.success.main, backgroundColor: alpha(palette.success.main, 0.1) },
  infoSolid: { color: palette.alwaysWhite.main, backgroundColor: palette.info.main },
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
    padding: `${spacing.xs}px ${spacing.md}px`,
    display: 'flex',
    position: 'relative',
    '& > svg': {
      marginLeft: spacing.xxs,
      marginRight: spacing.md,
      width: 21,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    '& em': { display: 'block', fontWeight: 400, fontSize: fontSizes.sm, fontStyle: 'normal' },
    '& strong': { fontSize: fontSizes.base, fontWeight: 500 },
    '& .MuiButton-root': { marginTop: 5 },
  }),
}))
