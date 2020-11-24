import React from 'react'
import { Icon } from '../Icon'
import { IconProps } from '../Icon/Icon'
import { Tooltip } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { makeStyles, IconButton, Badge, Box } from '@material-ui/core'
import { colors, spacing, Color } from '../../styling'

export interface ConnectionStateIconProps extends Partial<IconProps> {
  connection?: IConnection
  service?: IService
  device?: IDevice
  state?: ConnectionState
  mini?: boolean
  thisDevice?: boolean
}

export function ConnectionStateIcon({
  connection,
  service,
  device,
  state,
  mini,
  thisDevice,
  ...props
}: ConnectionStateIconProps) {
  const css = useStyles()
  const history = useHistory()

  let instance = service || device
  let icon = 'question-circle'
  let colorName: Color = 'warning'
  let showQuality = device?.quality === 'POOR' || device?.quality === 'MODERATE'
  let element: any

  state = state || instance?.state

  if (connection) {
    if (connection.active) state = 'connected'
    if (connection.connecting) state = 'connecting'
  }

  let name: any = state || 'unknown'

  switch (state) {
    case 'active':
      icon = 'check-circle'
      colorName = 'success'
      name = 'online'
      break
    case 'inactive':
      icon = 'minus-circle'
      colorName = 'grayLight'
      name = 'offline'
      showQuality = false
      break
    case 'connected':
      icon = 'scrubber'
      colorName = 'primary'
      break
    case 'connecting':
      icon = 'spinner-third'
      colorName = 'grayLight'
      showQuality = false
      break
    case 'restricted':
      icon = 'times-circle'
      colorName = 'danger'
      showQuality = false
      break
    case 'unknown':
      icon = 'question-circle'
      colorName = 'grayLight'
      showQuality = false
  }

  if (mini)
    element = (
      <span className={css.mini}>
        <span style={{ backgroundColor: colors[colorName] }} />
      </span>
    )
  else if (thisDevice)
    element = (
      <span className={css.combo}>
        <Icon {...props} name="hdd" color="grayDarker" fixedWidth />
        {!(showQuality && device) && (
          <sup>
            <Icon name={icon} color={colorName} spin={state === 'connecting'} size="sm" type="regular" fixedWidth />
          </sup>
        )}
      </span>
    )
  else element = <Icon {...props} name={icon} color={colorName} spin={state === 'connecting'} fixedWidth />

  if (showQuality && device) {
    name = (
      <>
        <b className={css.capitalize}>{name}</b>
        <br />
        <Icon
          name="circle"
          color={device.quality === 'POOR' ? 'danger' : 'warning'}
          size="bug"
          type="solid"
          inlineLeft
        />
        Internet connectivity {device.quality.toLowerCase()}
      </>
    )
    element = (
      <IconButton
        onClick={event => {
          event.stopPropagation()
          history.push(`/devices/${device.id}/details`)
        }}
      >
        <Badge
          variant="dot"
          color="error"
          overlap="circle"
          classes={{ colorError: device.quality === 'POOR' ? css.poor : css.moderate }}
        >
          {element}
        </Badge>
      </IconButton>
    )
  }

  return <Tooltip title={name}>{element}</Tooltip>
}

const useStyles = makeStyles({
  capitalize: { textTransform: 'capitalize' },
  mini: {
    '& > span': {
      height: 4,
      borderRadius: 4,
      width: spacing.md,
      display: 'inline-block',
      marginLeft: spacing.xxs,
    },
  },
  combo: {
    '& sup': {
      position: 'absolute',
      marginTop: -6,
      marginLeft: -8,
      backgroundColor: colors.white,
      borderRadius: '50%',
    },
  },
  moderate: { backgroundColor: colors.warning },
  poor: { backgroundColor: colors.danger },
})
