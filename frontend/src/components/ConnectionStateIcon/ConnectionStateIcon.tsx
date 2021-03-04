import React from 'react'
import { Icon } from '../Icon'
import { IconProps } from '../Icon/Icon'
import { Tooltip } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { makeStyles, IconButton, Badge } from '@material-ui/core'
import { getTargetPlatformIcon } from '../../helpers/platformHelper'
import { colors, spacing, Color } from '../../styling'

export interface ConnectionStateIconProps extends Partial<IconProps> {
  connection?: IConnection
  service?: IService
  device?: IDevice
  mini?: boolean
  thisDevice?: boolean
}

export function ConnectionStateIcon({
  connection,
  service,
  device,
  mini,
  thisDevice,
  ...props
}: ConnectionStateIconProps) {
  const css = useStyles()
  const history = useHistory()

  let { name, type } = getTargetPlatformIcon(device?.targetPlatform)

  let instance = service || device
  let colorName: Color = 'warning'
  let showQuality = device?.quality === 'POOR' || device?.quality === 'MODERATE'
  let element: any
  let state = instance?.state || ''

  if (connection) {
    if (connection.connected) state = 'connected'
    if (connection.connecting) state = 'connecting'
  }

  let title: any = state || 'unknown'

  switch (state) {
    case 'active':
      colorName = 'grayDarker'
      title = 'online'
      break
    case 'inactive':
      colorName = 'grayLighter'
      title = 'offline'
      showQuality = false
      break
    case 'connected':
      colorName = 'primary'
      break
    case 'connecting':
      name = 'spinner-third'
      colorName = 'grayLight'
      showQuality = false
      break
    case 'restricted':
      colorName = 'danger'
      showQuality = false
      break
    case 'unknown':
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
        <Icon {...props} name="hdd" color="grayDark" type="regular" fixedWidth />
        {!(showQuality && device) && (
          <sup>
            <Icon name={name} color={colorName} spin={state === 'connecting'} size="sm" type={type} fixedWidth />
          </sup>
        )}
      </span>
    )
  else {
    element = (
      <span>
        <Icon {...props} name={name} color={colorName} spin={state === 'connecting'} type={type} size="md" fixedWidth />
      </span>
    )
  }

  if (showQuality && device) {
    title = (
      <>
        <b className={css.capitalize}>{title}</b>
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
        className={css.button}
        onClick={event => {
          event.stopPropagation()
          history.push(`/devices/${device.id}/details`)
        }}
      >
        <Badge
          variant="dot"
          color="error"
          classes={{ colorError: device.quality === 'POOR' ? css.poor : css.moderate }}
        >
          {element}
        </Badge>
      </IconButton>
    )
  }

  return (
    <Tooltip title={title} placement="top" arrow>
      <span>{element}</span>
    </Tooltip>
  )
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
  button: { margin: `${-spacing.sm}px ${-spacing.sm}px` },
})
