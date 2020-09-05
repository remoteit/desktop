import React from 'react'
import { isDev } from '../../services/Browser'
import { useHistory } from 'react-router-dom'
import { useClipboard } from 'use-clipboard-copy'
import { useSelector } from 'react-redux'
import { findService } from '../../models/devices'
import { ComboButton } from '../../buttons/ComboButton'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ApplicationState } from '../../store'
import {
  makeStyles,
  Divider,
  Typography,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core'
import { colors, spacing } from '../../styling'
import { Icon } from '../Icon'

interface Props {
  el: HTMLElement | undefined
  setEl: (el?: HTMLElement) => void
  serviceID?: string
}

export const ServiceContextualMenu: React.FC<Props> = ({ serviceID = '', el, setEl }) => {
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const history = useHistory()
  const css = useStyles()

  if (!el) return null

  const handleClose = () => setEl(undefined)

  return (
    <Menu
      anchorEl={el}
      open={Boolean(el)}
      onClose={handleClose}
      anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
      disableScrollLock
      elevation={2}
    >
      <List>
        <ListItem className={css.name} dense>
          <Typography variant="caption" align="center" display="block">
            {service?.name}
          </Typography>
        </ListItem>
        <ListItem dense>
          <ComboButton className={css.button} connection={connection} service={service} />
        </ListItem>
      </List>
      <Divider />
      <List>
        <MenuItem dense onClick={clipboard.copy}>
          <ListItemIcon>
            <Icon
              name={clipboard.copied ? 'check' : 'link'}
              color={clipboard.copied ? 'success' : undefined}
              size="md"
            />
          </ListItemIcon>
          <ListItemText primary={clipboard.copied ? 'Copied!' : `Copy Link`} />
          <input
            type="hidden"
            ref={clipboard.target}
            value={`${isDev() ? 'remoteitdev' : 'remoteit'}://connect/${service?.id}`}
          />
        </MenuItem>
        {!device?.shared && (
          <MenuItem dense onClick={() => history.push(`/devices/${device?.id}/${service?.id}/users/share`)}>
            <ListItemIcon>
              <Icon name="user-plus" size="md" />
            </ListItemIcon>
            <ListItemText primary="Share" />
          </MenuItem>
        )}
      </List>
      <Divider />
      <List>
        <MenuItem dense onClick={() => history.push(`/devices/${device?.id}/${service?.id}`)}>
          <ListItemIcon>
            <ConnectionStateIcon connection={connection} service={service} size="md" />
          </ListItemIcon>
          <ListItemText primary="View Service" />
        </MenuItem>
        <MenuItem dense onClick={() => history.push(`/devices/${device?.id}/${service?.id}/edit`)}>
          <ListItemIcon>
            <Icon name="pen" size="md" />
          </ListItemIcon>
          <ListItemText primary="Edit Service" />
        </MenuItem>
        <MenuItem dense onClick={() => history.push(`/devices/${device?.id}/${service?.id}/details`)}>
          <ListItemIcon>
            <Icon name="info-circle" size="md" />
          </ListItemIcon>
          <ListItemText primary="Service Details" />
        </MenuItem>
      </List>
    </Menu>
  )
}

const useStyles = makeStyles({
  name: { paddingTop: 0, paddingBottom: 0 },
  button: { margin: `${spacing.xs}px 0`, width: '100%' },
})
