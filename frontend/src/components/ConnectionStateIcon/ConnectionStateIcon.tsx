import React from 'react'
import { Icon } from '../Icon'
import { IconProps } from '../Icon/Icon'
import { Tooltip } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { makeStyles, IconButton, Badge } from '@material-ui/core'
import { getTargetPlatformIcon } from '../../helpers/platformHelper'
import { spacing, FontSize } from '../../styling'

export interface ConnectionStateIconProps extends Partial<IconProps> {
  connection?: IConnection
  service?: IService
  device?: IDevice
  mini?: boolean
  size?: FontSize
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
  const instance = device || service

  let { name, type } = getTargetPlatformIcon(device?.targetPlatform)

  let showQuality = device?.quality === 'POOR' || device?.quality === 'MODERATE'
  let element: any
  let quality: any
  let spin = false

  if (connection?.connecting) {
    name = 'spinner-third'
    type = 'regular'
    showQuality = false
    spin = true
  }
  if (instance?.state === 'inactive') {
    showQuality = false
  }

  const css = useStyles()

  if (mini)
    element = (
      <span className={css.mini}>
        <span />
      </span>
    )
  else {
    element = <Icon {...props} size={size} name={name} spin={spin} type={type} color="black" fullColor fixedWidth />
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
        Connectivity {device.quality.toLowerCase()}
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
          classes={{ colorError: device.quality === 'POOR' ? css.poor : css.moderate, badge: css.badge }}
        >
          {element}
        </Badge>
      </IconButton>
    )
  }

  return quality ? (
    <Tooltip title={quality} placement="top" arrow>
      <span className={css.icon}>{element}</span>
    </Tooltip>
  ) : (
    element
  )
}

const useStyles = makeStyles(({ palette }) => ({
  capitalize: { textTransform: 'capitalize' },
  icon: { lineHeight: 1 },
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
      backgroundColor: palette.white.main,
      borderRadius: '50%',
    },
  },
  moderate: { backgroundColor: palette.warning.main },
  poor: { backgroundColor: palette.danger.main },
  button: { margin: `${-spacing.sm}px ${-spacing.sm}px` },
  badge: { boxShadow: `0 0 4px 3px ${palette.grayLightest.main}` },
}))
