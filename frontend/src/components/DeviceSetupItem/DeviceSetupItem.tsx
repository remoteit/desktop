import React from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { makeStyles, ListItem, ListItemText, ListItemSecondaryAction, Link, Chip, Typography } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { getOwnDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { Notice } from '../../components/Notice'
import { osName } from '../../shared/nameHelper'

export const DeviceSetupItem: React.FC<{ restore?: boolean }> = ({ restore }) => {
  const css = useStyles()
  const history = useHistory()
  const { backendAuthenticated, thisDevice, targetDevice, os, canRestore, restoring } = useSelector(
    (state: ApplicationState) => ({
      backendAuthenticated: state.auth.backendAuthenticated,
      thisDevice: getOwnDevices(state).find(d => d.thisDevice),
      targetDevice: state.backend.device,
      os: state.backend.environment.os,
      restoring: state.ui.restoring,
      canRestore:
        !state.backend.device.uid &&
        (state.devices.total > state.devices.size ||
          !!getOwnDevices(state).find((d: IDevice) => d.state !== 'active' && !d.shared)),
    })
  )

  if (!backendAuthenticated) return null

  if (restoring)
    return (
      <ListItem>
        <Notice loading={true}>Restoring device.</Notice>
      </ListItem>
    )

  const registered = !!targetDevice.uid
  let title = 'Set up this device'
  let subtitle = `Add remote access to this ${osName(os)} or any service on the network.`

  if (registered) {
    if (thisDevice) {
      title = attributeName(thisDevice) || targetDevice.name || ''
      subtitle = `Configure this system.`
    } else {
      return <Notice>This device is not registered to you.</Notice>
    }
  }

  return (
    <ListItemLocation icon="hdd" pathname="/devices/setup" className={canRestore ? css.margin : undefined} dense>
      <ListItemText primary={title} secondary={subtitle} />
      {canRestore && (
        <ListItemSecondaryAction>
          {restore ? (
            <Typography variant="body2" color="textSecondary">
              Select a device or
              <Link onClick={() => history.push('/devices')}>cancel</Link>
            </Typography>
          ) : (
            <Chip
              label="Restore Device"
              variant="default"
              size="small"
              onClick={() => history.push('/devices/restore')}
            />
          )}
        </ListItemSecondaryAction>
      )}
    </ListItemLocation>
  )
}

const useStyles = makeStyles({
  margin: { paddingRight: 125 },
})
