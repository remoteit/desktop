import React from 'react'
import { useHistory } from 'react-router-dom'
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
  const history = useHistory()
  const { thisDevice, targetDevice, os, links, canRestore, restore, restoring } = useSelector(
    (state: ApplicationState) => ({
      thisDevice: getOwnDevices(state).find(d => d.id === state.backend.device.uid),
      targetDevice: state.backend.device,
      os: state.backend.environment.os,
      links: getLinks(state),
      canRestore:
        !state.backend.device.uid &&
        (state.devices.total > state.devices.size ||
          !!getOwnDevices(state).find((d: IDevice) => d.state !== 'active' && !d.shared)),
      restore: state.ui.restore,
      restoring: state.ui.restoring,
    })
  )

  if (restoring)
    return (
      <ListItem>
        <Notice loading={true}>Restoring device.</Notice>
      </ListItem>
    )

  const registered = !!targetDevice.uid
  let title = 'Set up remote access'
  let subtitle = `Set up remote access to this ${osName(os)} or any other service on the network.`

  if (registered) {
    if (thisDevice) {
      title = attributeName(thisDevice) || targetDevice.name || ''
      subtitle = `Configure remote access to this ${osName(os)} or any other service on the network.`
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
        <Icon name="hdd" size="md" type="regular" />
      </ListItemIcon>
      <ListItemText primary={title} secondary={subtitle} />
      {canRestore && (
        <ListItemSecondaryAction>
          {restore ? (
            <Typography variant="body2" color="textSecondary">
              Select a device or
              <Link onClick={() => ui.set({ restore: false })}>cancel</Link>
            </Typography>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                ui.set({ restore: true })
                history.push('/devices')
              }}
            >
              Restore Device
            </Button>
          )}
        </ListItemSecondaryAction>
      )}
    </ListItemLocation>
  )
}
