import React from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getDeviceModel } from '../../models/accounts'
import { ApplicationState } from '../../store'
import { makeStyles, ListItem, ListItemText, ListItemSecondaryAction, Link, Chip, Typography } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { getAllDevices } from '../../models/accounts'
import { attributeName } from '../../shared/nameHelper'
import { DesktopUI } from '../../components/DesktopUI'
import { Notice } from '../../components/Notice'
import { osName } from '../../shared/nameHelper'

export const DeviceSetupItem: React.FC<{ restore?: boolean }> = ({ restore }) => {
  const css = useStyles()
  const history = useHistory()
  const { ownDevice, targetDevice, os, canRestore, restoring } = useSelector((state: ApplicationState) => ({
    ownDevice: getAllDevices(state).find(d => d.thisDevice && d.owner.id === state.auth.user?.id),
    targetDevice: state.backend.device,
    os: state.backend.environment.os,
    restoring: state.ui.restoring,
    canRestore:
      !state.backend.device.uid &&
      (getDeviceModel(state).total > getDeviceModel(state).size ||
        !!getAllDevices(state).find((d: IDevice) => d.state !== 'active' && !d.shared)),
  }))

  if (restoring)
    return (
      <ListItem>
        <Notice loading={true}>Restoring device.</Notice>
      </ListItem>
    )

  const registered = !!targetDevice.uid
  let title = 'Set up this device'
  let subtitle = `Add remote access to this ${osName(os)} or any service on the local network.`

  if (registered) {
    if (ownDevice) {
      title = attributeName(ownDevice) || targetDevice.name || ''
      subtitle = `Configure this system.`
    } else {
      return <Notice>This system is not registered to you.</Notice>
    }
  }

  return (
    <DesktopUI>
      <ListItemLocation icon="laptop" pathname="/devices/setup" className={canRestore ? css.margin : undefined} dense>
        <ListItemText primary={title} secondary={subtitle} />
        {canRestore && (
          <ListItemSecondaryAction>
            {restore ? (
              <Typography variant="body2" color="textSecondary">
                Select a device or
                <Link onClick={() => history.push('/devices')}>cancel</Link>
              </Typography>
            ) : (
              <Chip label="Restore" variant="default" size="small" onClick={() => history.push('/devices/restore')} />
            )}
          </ListItemSecondaryAction>
        )}
      </ListItemLocation>
    </DesktopUI>
  )
}

const useStyles = makeStyles({
  margin: { paddingRight: 80 },
})
