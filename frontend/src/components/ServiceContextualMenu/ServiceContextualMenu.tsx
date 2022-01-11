import React from 'react'
import { PROTOCOL } from '../../shared/constants'
import { useHistory } from 'react-router-dom'
import { isRemoteUI } from '../../helpers/uiHelper'
import { CopyButton } from '../../buttons/CopyButton'
import { getDevices } from '../../models/accounts'
import { findService } from '../../models/devices'
import { ComboButton } from '../../buttons/ComboButton'
import { LaunchButton } from '../../buttons/LaunchButton'
import { useApplication } from '../../hooks/useApplication'
import { selectConnection } from '../../helpers/connectionHelper'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles, Typography, Menu, MenuItem, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { CopyMenuItem } from '../CopyMenuItem'
import { spacing } from '../../styling'
import { Icon } from '../Icon'

export const ServiceContextualMenu: React.FC = () => {
  const { ui } = useDispatch<Dispatch>()
  const { el, remoteUI, connection, service, device } = useSelector((state: ApplicationState) => {
    const { el, serviceID } = state.ui.serviceContextMenu || {}
    const [service, device] = findService(getDevices(state), serviceID)
    return {
      el,
      remoteUI: isRemoteUI(state),
      connection: selectConnection(state, service),
      service,
      device,
    }
  })
  const app = useApplication(service, connection)
  const history = useHistory()
  const css = useStyles()

  if (!el) return null

  const handleClose = () => ui.set({ serviceContextMenu: undefined })
  const handleGo = path => {
    handleClose()
    history.push(path)
  }

  return (
    <Menu
      anchorEl={el}
      open={Boolean(el)}
      onClose={handleClose}
      anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
      disableScrollLock
      elevation={2}
    >
      <ListItem className={css.name} dense>
        <Typography variant="caption" align="center" display="block">
          {service?.name}
        </Typography>
      </ListItem>
      {!remoteUI && (
        <ListItem className={css.connect} dense>
          <ComboButton connection={connection} service={service} size="small" permissions={device?.permissions} />
          <CopyButton app={app} icon="copy" size="base" />
          <LaunchButton connection={connection} service={service} size="base" />
        </ListItem>
      )}
      {connection?.enabled && (
        <MenuItem dense disableGutters onClick={() => handleGo(`/connections/${service?.id}`)}>
          <ListItemIcon>
            <Icon name="chart-network" size="md" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Connection Details" color="primary" classes={{ primary: css.connected }} />
        </MenuItem>
      )}
      {!device?.shared && (
        <MenuItem dense disableGutters onClick={() => handleGo(`/devices/${device?.id}/${service?.id}/users/share`)}>
          <ListItemIcon>
            <Icon name="user-plus" size="md" />
          </ListItemIcon>
          <ListItemText primary="Share" />
        </MenuItem>
      )}
      <CopyMenuItem icon="share-alt" title="Copy Sharable Link" value={`${PROTOCOL}connect/${service?.id}`} />
      {!device?.shared && (
        <MenuItem dense disableGutters onClick={() => handleGo(`/devices/${device?.id}/${service?.id}/edit`)}>
          <ListItemIcon>
            <Icon name="pen" size="md" />
          </ListItemIcon>
          <ListItemText primary="Edit Service" />
        </MenuItem>
      )}
      <MenuItem dense disableGutters onClick={() => handleGo(`/devices/${device?.id}/${service?.id}/details`)}>
        <ListItemIcon>
          <Icon name="info-circle" size="md" />
        </ListItemIcon>
        remoteitdev://connect/80:00:00:00:01:08:D8:97
        <ListItemText primary="Service Details" />
      </MenuItem>
    </Menu>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  name: { paddingTop: 0, paddingLeft: spacing.md },
  connect: {
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: -spacing.xs,
    '& > button + button': { marginLeft: -spacing.xs },
    '& > div': { margin: `${spacing.xs}px ${spacing.xs}px`, width: '100%', minWidth: 150 },
  },
  connected: { color: palette.primary.main },
}))
