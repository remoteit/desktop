import React from 'react'
import { isDev } from '../../services/Browser'
import { useHistory } from 'react-router-dom'
import { isRemoteUI } from '../../helpers/uiHelper'
import { useClipboard } from 'use-clipboard-copy'
import { CopyButton } from '../../buttons/CopyButton'
import { getDevices } from '../../models/accounts'
import { findService } from '../../models/devices'
import { ComboButton } from '../../buttons/ComboButton'
import { LaunchButton } from '../../buttons/LaunchButton'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles, Typography, Menu, MenuItem, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { spacing, colors } from '../../styling'
import { Icon } from '../Icon'

export const ServiceContextualMenu: React.FC = () => {
  const { ui } = useDispatch<Dispatch>()
  const { el, remoteUI, connection, service, device } = useSelector((state: ApplicationState) => {
    const { el, serviceID } = state.ui.serviceContextMenu || {}
    const [service, device] = findService(getDevices(state), serviceID)
    return {
      el,
      remoteUI: isRemoteUI(state),
      connection: state.connections.all.find(c => c.id === serviceID),
      service,
      device,
    }
  })
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const history = useHistory()
  const css = useStyles()

  if (!el) return null

  const handleClose = () => ui.set({ serviceContextMenu: undefined })

  return (
    <Menu
      anchorEl={el}
      open={Boolean(el)}
      className={css.menu}
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
          <ComboButton connection={connection} service={service} size="small" />
          <CopyButton connection={connection} service={service} size="base" />
          <LaunchButton connection={connection} service={service} size="base" />
        </ListItem>
      )}
      {connection?.enabled && (
        <MenuItem dense onClick={() => history.push(`/connections/${service?.id}`)}>
          <ListItemIcon>
            <Icon name="arrow-right" size="md" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Connection Details" color="primary" classes={{ primary: css.connected }} />
        </MenuItem>
      )}
      {!device?.shared && (
        <MenuItem dense onClick={() => history.push(`/devices/${device?.id}/${service?.id}/users/share`)}>
          <ListItemIcon>
            <Icon name="user-plus" size="md" />
          </ListItemIcon>
          <ListItemText primary="Share" />
        </MenuItem>
      )}
      <MenuItem dense onClick={clipboard.copy}>
        <ListItemIcon>
          <Icon name={clipboard.copied ? 'check' : 'link'} color={clipboard.copied ? 'success' : undefined} size="md" />
        </ListItemIcon>
        <ListItemText primary={clipboard.copied ? 'Copied!' : 'Copy Desktop Link'} />
        <input
          type="hidden"
          ref={clipboard.target}
          value={`${isDev() ? 'remoteitdev' : 'remoteit'}://connect/${service?.id}`}
        />
      </MenuItem>
      {!device?.shared && (
        <MenuItem dense onClick={() => history.push(`/devices/${device?.id}/${service?.id}/edit`)}>
          <ListItemIcon>
            <Icon name="pen" size="md" />
          </ListItemIcon>
          <ListItemText primary="Edit Service" />
        </MenuItem>
      )}
      <MenuItem dense onClick={() => history.push(`/devices/${device?.id}/${service?.id}/details`)}>
        <ListItemIcon>
          <Icon name="info-circle" size="md" />
        </ListItemIcon>
        <ListItemText primary="Service Details" />
      </MenuItem>
    </Menu>
  )
}

const useStyles = makeStyles({
  menu: {
    '& .MuiMenuItem-root': {
      paddingLeft: 0,
      paddingRight: spacing.lg,
    },
  },
  name: { paddingTop: 0, paddingLeft: spacing.md },
  connect: {
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: -spacing.xs,
    '& > button + button': { marginLeft: -spacing.xs },
    '& > div': { margin: `${spacing.xs}px ${spacing.xs}px`, width: '100%', minWidth: 150 },
  },
  connected: { color: colors.primary },
})
