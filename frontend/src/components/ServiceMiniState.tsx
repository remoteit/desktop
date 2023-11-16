import React from 'react'
import { makeStyles } from '@mui/styles'
import { Box, alpha, useTheme } from '@mui/material'
import { spacing, fontSizes, Color, radius } from '../styling'
import { getLicenseChip } from './LicenseChip'
import { Icon } from './Icon'
import classnames from 'classnames'

interface Props {
  connection?: IConnection
  service?: IService
  onClick?: (IContextMenu) => void
  className?: string
}

export const ServiceMiniState: React.FC<Props> = ({ connection, service, onClick, className }) => {
  const theme = useTheme()
  const css = useStyles()

  let color: Color = 'grayDarker'
  let state = service ? service.state : 'unknown'
  let icon: React.ReactNode = null

  if (state !== 'inactive' && connection) {
    if (connection.connecting || connection.stopping) state = 'transition'
    if (connection.connected || connection.enabled) state = 'connected'
    if (connection.error?.message) state = 'error'
  }

  switch (state) {
    case 'error':
      color = 'danger'
      break
    case 'active':
      color = 'grayDarker'
      break
    case 'connected':
      color = 'primary'
      break
    case 'transition':
      color = 'grayDarkest'
      break
    case 'restricted':
      color = 'danger'
      break
    case 'unknown':
      color = 'grayLight'
  }

  if (!service) return null

  const chip = getLicenseChip(service.license)
  if (chip.show) color = chip.colorName

  const onMouseDown = event => {
    event.stopPropagation()
    onClick && onClick({ el: event.currentTarget, serviceID: service.id })
  }

  if (service.link?.enabled) {
    icon = <Icon name={service.link.url.startsWith('http') ? 'globe' : 'key'} type="solid" size="xxxs" inline />
  }

  return (
    <Box
      component="span"
      className={classnames(onClick && css.clickable, css.indicator, className)}
      onMouseDown={onMouseDown}
    >
      <Box
        component="span"
        sx={{
          color: `${color}.main`,
          backgroundColor: alpha(theme.palette[color].main, 0.1),
          textDecoration: state === 'inactive' ? 'line-through' : undefined,
        }}
      >
        {service.type}
        {icon}
      </Box>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  button: { padding: '8px 0' },
  icon: { padding: '0 0 8px' },
  indicator: {
    display: 'inline-flex',
    alignItems: 'center',
    '& > span': {
      borderRadius: radius,
      fontSize: fontSizes.xxs,
      fontWeight: 500,
      padding: 1,
      paddingLeft: spacing.xs,
      paddingRight: spacing.xs,
      marginLeft: 1,
      marginRight: 1,
      '& svg': { marginRight: 2 },
    },
  },
  background: {
    display: 'flex',
    alignItems: 'center',
  },
  clickable: {
    cursor: 'pointer',
    '&:hover > span': {
      boxShadow: `0px 1px 2px ${palette.darken.main}`,
    },
  },
}))
