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
  let colorName: Color = 'grayDarker'
  let showQuality = device?.quality === 'POOR' || device?.quality === 'MODERATE'
  let element: any
  let opacity: number = 1
  let title: any = 'Unknown'

  if (connection) {
    if (connection.enabled) {
      colorName = 'primary'
      title = 'Connected'
    }
    if (connection.connecting) {
      name = 'spinner-third'
      colorName = 'grayLight'
      showQuality = false
      title = 'Connecting'
    }
  }

  if (instance?.state === 'inactive') {
    opacity = 0.2
    title = 'offline'
    showQuality = false
  }

  if (service?.license === 'EVALUATION') {
    colorName = 'warning'
    title = 'Evaluation'
  }
  if (service?.license === 'UNLICENSED') {
    colorName = 'grayLight'
    title = 'Unlicensed'
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
            <Icon name={name} color={colorName} spin={connection?.connecting} size="sm" type={type} fixedWidth />
          </sup>
        )}
      </span>
    )
  else {
    element = (
      <span>
        <Icon {...props} name={name} color={colorName} spin={connection?.connecting} type={type} size="md" fixedWidth />
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
      <span style={{ opacity }}>{element}</span>
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
