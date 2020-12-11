import React from 'react'
import { emit } from '../../services/Controller'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Link,
  Button,
  Typography,
} from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { getOwnDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { getLinks } from '../../helpers/routeHelper'
import { Notice } from '../../components/Notice'
import { osName } from '../../shared/nameHelper'
import { Icon } from '../Icon'

export const DeviceSetupItem: React.FC = () => {
  const { ui } = useDispatch<Dispatch>()
  const { thisDevice, targetDevice, os, links, restore, restoring } = useSelector((state: ApplicationState) => ({
    thisDevice: getOwnDevices(state).find(d => d.id === state.backend.device.uid),
    targetDevice: state.backend.device,
    os: state.backend.environment.os,
    links: getLinks(state),
    restore: state.ui.restore,
    restoring: state.ui.restoring,
  }))

  if (restoring)
    return (
      <ListItem>
        <Notice loading={true}>Restoring device.</Notice>
      </ListItem>
    )

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
      <ListItemSecondaryAction>
        {restore ? (
          <>
            <Typography variant="body2" color="textSecondary">
              Select a device or
              <Link onClick={() => ui.set({ restore: false })}>cancel</Link>
            </Typography>
          </>
        ) : (
          <Button color="primary" size="small" onClick={() => ui.set({ restore: true })}>
            Restore Device
          </Button>
        )}
      </ListItemSecondaryAction>
    </ListItemLocation>
  )
}
