import React from 'react'
import { isDev } from '../../services/Browser'
import { useHistory } from 'react-router-dom'
import { useClipboard } from 'use-clipboard-copy'
import { useSelector } from 'react-redux'
import { CopyButton } from '../../buttons/CopyButton'
import { getDevices } from '../../models/accounts'
import { findService } from '../../models/devices'
import { ComboButton } from '../../buttons/ComboButton'
import { LaunchButton } from '../../buttons/LaunchButton'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ApplicationState } from '../../store'
import {
  makeStyles,
  Divider,
  Typography,
  Menu,
  MenuItem,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core'
import { spacing } from '../../styling'
import { Icon } from '../Icon'

interface Props {
  el: HTMLElement | undefined
  setEl: (el?: HTMLElement) => void
  serviceID?: string
}

export const ServiceContextualMenu: React.FC<Props> = ({ serviceID = '', el, setEl }) => {
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(getDevices(state), serviceID))
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const history = useHistory()
  const css = useStyles()

  if (!el) return null

  const handleClose = () => setEl(undefined)

  return (
    <Menu
      anchorEl={el}
      open={Boolean(el)}
      // classes={{ paper: css.menu }}
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
      <ListItem className={css.connect} dense>
        <ComboButton connection={connection} service={service} size="small" />
        <CopyButton connection={connection} service={service} size="base" />
        <LaunchButton connection={connection} service={service} size="base" />
      </ListItem>
      <Divider />
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
      <Divider />
      <MenuItem dense disableGutters onClick={() => history.push(`/devices/${device?.id}/${service?.id}`)}>
        <ListItemIcon>
          <ConnectionStateIcon connection={connection} service={service} size="md" />
        </ListItemIcon>
        <ListItemText primary="View Service" />
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
  name: { paddingTop: 0, paddingBottom: 0 },
  connect: {
    '& > button + button': { marginLeft: -spacing.sm, marginRight: -spacing.xs },
    '& > div': { margin: `${spacing.xs}px 0`, width: '100%', minWidth: 120 },
  },
})
