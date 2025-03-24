import React from 'react'
import { makeStyles } from '@mui/styles'
import { Box, alpha, useTheme } from '@mui/material'
import { spacing, fontSizes, radius } from '../styling'
import { ServiceLinkIcon } from './ServiceLinkIcon'
import { getLicenseChip } from './LicenseChip'
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

  let color: Color = 'grayDark'
  let colorBackground: string = ''
  let state = service ? service.state : 'unknown'

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
      color = 'grayDark'
      colorBackground = 'grayLighter.main'
      break
    case 'inactive':
      color = 'grayDark'
      colorBackground = 'grayLighter.main'
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

  return (
    <Box
      component="span"
      className={classnames(onClick && css.clickable, css.indicator, className)}
      onMouseDown={onClick && onMouseDown}
    >
      <Box
        component="span"
        sx={{
          color: `${color}.main`,
          backgroundColor: colorBackground || alpha(theme.palette[color].main, 0.1),
          textDecoration: state === 'inactive' ? 'line-through' : undefined,
        }}
      >
        {service.type}
        <ServiceLinkIcon service={service} type="solid" size="xxxs" inline />
      </Box>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  indicator: {
    display: 'inline-flex',
    alignItems: 'center',
    '& > span': {
      borderRadius: radius.sm,
      fontSize: fontSizes.xs,
      fontWeight: 500,
      padding: 1,
      paddingLeft: spacing.xs,
      paddingRight: spacing.xs,
      marginLeft: 1,
      marginRight: 1,
      '& svg': { marginRight: 2 },
    },
  },
  clickable: {
    cursor: 'pointer',
    '&:hover > span': { backgroundColor: palette.action.hover },
  },
}))
