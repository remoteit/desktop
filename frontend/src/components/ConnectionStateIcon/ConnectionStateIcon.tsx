import React from 'react'
import { Icon } from '../Icon'
import { IconProps } from '../Icon/Icon'
import { Tooltip } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { makeStyles, IconButton, Badge } from '@material-ui/core'
import { getTargetPlatformIcon } from '../../helpers/platformHelper'
import { spacing, Color } from '../../styling'

export interface ConnectionStateIconProps extends Partial<IconProps> {
  connection?: IConnection
  service?: IService
  device?: IDevice
  mini?: boolean
}

export function ConnectionStateIcon({ connection, service, device, mini, ...props }: ConnectionStateIconProps) {
  const history = useHistory()
  const instance = device || service

  let { name, type } = getTargetPlatformIcon(device?.targetPlatform)

  let colorName: Color = 'grayDarker'
  let showQuality = device?.quality === 'POOR' || device?.quality === 'MODERATE'
  let element: any
  let opacity: number = 1
  let title: any = 'Online'
  let spin = false

  if (connection?.enabled) {
    colorName = 'primary'
    title = 'Connected'
  }
  if (connection?.connecting) {
    name = 'spinner-third'
    type = 'regular'
    colorName = 'grayLight'
    showQuality = false
    title = 'Connecting'
    spin = true
  }
  if (instance?.state === 'inactive') {
    title = 'Offline'
    showQuality = false
  }

  if (instance?.license === 'EVALUATION') {
    colorName = 'warning'
    title = 'Evaluation'
  }
  if (instance?.license === 'UNLICENSED') {
    colorName = 'warning'
    title = 'Unlicensed'
  }

  const css = useStyles({ colorName })

  if (mini)
    element = (
      <span className={css.mini}>
        <span />
      </span>
    )
  else {
    element = <Icon {...props} name={name} color={colorName} spin={spin} type={type} size="md" fixedWidth />
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
          overlap="circular"
          classes={{ colorError: device.quality === 'POOR' ? css.poor : css.moderate }}
        >
          {element}
        </Badge>
      </IconButton>
    )
  }

  return (
    <Tooltip title={title} placement="top" arrow>
      <span className={css.icon}>{element}</span>
    </Tooltip>
  )
}

type StyleProps = {
  colorName: Color
}

const useStyles = makeStyles(({ palette }) => ({
  capitalize: { textTransform: 'capitalize' },
  icon: {
    lineHeight: 1,
  },
  mini: ({ colorName }: StyleProps) => ({
    '& > span': {
      height: 4,
      borderRadius: 4,
      width: spacing.md,
      display: 'inline-block',
      marginLeft: spacing.xxs,
      backgroundColor: palette[colorName].main,
    },
  }),
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
}))
