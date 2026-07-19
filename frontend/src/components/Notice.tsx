import React from 'react'
import { Icon } from './Icon'
import { IconButton } from '../buttons/IconButton'
import { spacing, fontSizes, toSxArray } from '../styling'
import { alpha, SxProps, Theme, Paper, Box } from '@mui/material'

const severityColors = { info: 'calm', error: 'error', warning: 'warning', success: 'success' } as const

const severitySx = (theme: Theme, severity: 'info' | 'warning' | 'error' | 'success', solid?: boolean) => {
  const color = theme.palette[severityColors[severity]].main
  return solid
    ? { color: theme.palette.alwaysWhite.main, backgroundColor: color }
    : { color, backgroundColor: alpha(color, 0.1) }
}

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
      elevation={0}
      className={className}
      sx={[
        {
          flexGrow: 1,
          alignItems: 'flex-start',
          marginLeft: fullWidth ? 0 : `${spacing.md}px`,
          marginRight: fullWidth ? 0 : `${spacing.md}px`,
          marginBottom: gutterBottom ? `${spacing.md}px` : 0,
          marginTop: gutterTop ? `${spacing.md}px` : 0,
          padding: `${spacing.xs}px ${spacing.md}px`,
          display: 'flex',
          position: 'relative',
          '& > svg': {
            marginLeft: `${spacing.xxs}px`,
            marginRight: `${spacing.md}px`,
            width: 21,
            paddingTop: `${spacing.sm}px`,
            paddingBottom: `${spacing.sm}px`,
          },
          '& em': { display: 'block', fontWeight: 400, fontSize: fontSizes.sm, fontStyle: 'normal' },
          '& strong': { fontSize: fontSizes.base, fontWeight: 500 },
          '& .MuiButton-root': { marginTop: '5px' },
        },
        (theme: Theme) => severitySx(theme, severity, solid),
        ...toSxArray(sx),
      ]}
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
