import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { getOwnDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { getLinks } from '../../helpers/routeHelper'
import { Notice } from '../../components/Notice'
import { osName } from '../../shared/nameHelper'
import { Icon } from '../Icon'

export const DeviceSetupItem: React.FC = () => {
  const { thisDevice, targetDevice, os, links } = useSelector((state: ApplicationState) => ({
    thisDevice: getOwnDevices(state).find(d => d.id === state.backend.device.uid),
    targetDevice: state.backend.device,
    os: state.backend.environment.os,
    links: getLinks(state),
  }))

  const registered = !!targetDevice.uid
  let title = 'Set up remote access'
  let subTitle = `Set up remote access to this ${osName(os)} or any other service on the network.`

  if (registered) {
    if (thisDevice) {
      title = attributeName(thisDevice) || targetDevice.name || ''
      subTitle = `Configure remote access to this ${osName(os)} or any other service on the network.`
    } else {
      return (
        <ListItem>
          <Notice>This device is not registered to you.</Notice>
        </ListItem>
      )
    }
  }

  return (
    <ListItemLocation pathname={links.setup}>
      <ListItemIcon>
        <Icon name="hdd" size="md" type="light" />
      </ListItemIcon>
      <ListItemText primary={title} secondary={subTitle} />
    </ListItemLocation>
  )
}
