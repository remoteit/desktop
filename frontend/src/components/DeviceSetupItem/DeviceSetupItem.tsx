import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { colors } from '../../styling'
import { ListItemIcon, List, ListItemText } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { Icon } from '../Icon'

const osName = {
  mac: 'Mac',
  windows: 'Windows PC',
  linux: 'Linux system',
  rpi: 'RaspberryPi',
}

export const DeviceSetupItem: React.FC = () => {
  const css = useStyles()
  const { device, os } = useSelector((state: ApplicationState) => ({
    device: state.backend.device,
    os: state.backend.environment.os,
  }))

  let title: any = <span className={css.title}>Setup this {os ? osName[os] : 'system'} as a device.</span>
  let subTitle = 'Host or port forward services with this system.'

  if (device.name) {
    title = device.name
    subTitle = 'This system’s hosted or port forwarded services.'
  }

  return (
    <List>
      <ListItemLocation pathname={'/settings/setup'}>
        <ListItemIcon>
          <Icon name="hdd" size="md" weight="light" />
        </ListItemIcon>
        <ListItemText primary={title} secondary={subTitle} />
      </ListItemLocation>
    </List>
  )
}

const useStyles = makeStyles({
  title: { color: colors.primary },
})
