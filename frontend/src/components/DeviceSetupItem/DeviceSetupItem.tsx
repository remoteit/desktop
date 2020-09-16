import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { ApplicationState } from '../../store'
import { ListItemIcon, ListItemText } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { osName } from '../../shared/nameHelper'
import { Icon } from '../Icon'

export const DeviceSetupItem: React.FC = () => {
  const location = useLocation()
  const { targetDevice, os } = useSelector((state: ApplicationState) => ({
    targetDevice: state.backend.device,
    os: state.backend.environment.os,
  }))

  const registered = !!targetDevice.uid
  let title = 'Set up remote access'
  let subTitle = `Set up remote access to this ${osName(os)} or any other service on the network.`

  if (registered) {
    title = targetDevice.name
    subTitle = `Configure remote access to this ${osName(os)} or any other service on the network.`
  }

  return (
    <ListItemLocation pathname={`${location.pathname}/setup`}>
      <ListItemIcon>
        <Icon name="hdd" size="md" type="light" />
      </ListItemIcon>
      <ListItemText primary={title} secondary={subTitle} />
    </ListItemLocation>
  )
}
