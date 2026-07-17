import React from 'react'
import { Icon } from '../Icon'
import { IconProps } from '../Icon'
import { useHistory } from 'react-router-dom'
import { Box, Tooltip, IconButton, Badge } from '@mui/material'
import { spacing, Sizes } from '../../styling'

export interface ConnectionStateIconProps extends Partial<IconProps> {
  connection?: IConnection
  service?: IService
  device?: IDevice
  mini?: boolean
  size?: Sizes
}

export function ConnectionStateIcon({
  connection,
  service,
  device,
  mini,
  size = 'md',
  ...props
}: ConnectionStateIconProps) {
  const history = useHistory()

  let name
  let showQuality = device?.quality === 'POOR' || device?.quality === 'MODERATE'
  let element: any
  let quality: any
  let spin = false

  if (connection?.connecting || connection?.starting) {
    name = 'spinner-third'
    showQuality = false
    spin = true
  }

  if (mini)
    element = (
      <Box
        component="span"
        sx={{
          '& > span': {
            height: '4px',
            borderRadius: '4px',
            width: `${spacing.md}px`,
            display: 'inline-block',
            marginLeft: `${spacing.xxs}px`,
          },
        }}
      >
        <span />
      </Box>
    )
  else {
    element = <Icon {...props} size={size} name={name} spin={spin} platform={device?.targetPlatform} platformIcon />
  }

  if (showQuality && device) {
    quality = (
      <>
        <Icon
          name="circle"
          color={device.quality === 'POOR' ? 'danger' : 'warning'}
          size="bug"
          type="solid"
          inlineLeft
        />
        Stability {device.quality.toLowerCase()}
      </>
    )

    element = (
      <IconButton
        sx={{ margin: `${-spacing.sm}px ${-spacing.sm}px` }}
        onClick={event => {
          event.stopPropagation()
          history.push(`/devices/${device.id}/details`)
        }}
        size="large"
      >
        <Badge
          variant="dot"
          color="error"
          sx={theme => ({
            '& .MuiBadge-badge': {
              backgroundColor: device.quality === 'POOR' ? theme.palette.danger.main : theme.palette.warning.main,
              boxShadow: `0 0 4px 3px ${theme.palette.grayLightest.main}`,
            },
          })}
        >
          {element}
        </Badge>
      </IconButton>
    )
  }

  return quality ? (
    <Tooltip title={quality} placement="top" arrow>
      <Box component="span" sx={{ lineHeight: 1 }}>
        {element}
      </Box>
    </Tooltip>
  ) : (
    element
  )
}
