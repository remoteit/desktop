import React from 'react'
import { useHistory } from 'react-router-dom'
import { useClipboard } from 'use-clipboard-copy'
import { useSelector } from 'react-redux'
import { findService } from '../../models/devices'
import { ComboButton } from '../../buttons/ComboButton'
import { ApplicationState } from '../../store'
import { makeStyles, Divider, Typography, Menu, MenuItem, ListItemIcon } from '@material-ui/core'
import { colors, spacing, Color } from '../../styling'
import { SessionsTooltip } from '../SessionsTooltip'
import { Icon } from '../Icon'

interface Props {
  el: HTMLElement | undefined
  setEl: (el?: HTMLElement) => void
  serviceID?: string
}

export const ServiceContextualMenu: React.FC<Props> = ({ serviceID = '', el, setEl }) => {
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  const [openTooltip, setOpenTooltip] = React.useState<boolean>(false)
  const history = useHistory()
  const css = useStyles()
  const connected = !!service?.sessions.length

  let colorName: Color = 'warning'
  let state = service ? service.state : 'unknown'

  if (connection) {
    if (connection.connecting && !connection.active) state = 'connecting'
    if (connection.active) state = 'connected'
    if (connection.error?.message) state = 'error'
  }

  if (!el) return null

  const handleClose = () => setEl(undefined)

  return (
    <Menu
      classes={{ paper: css.menu }}
      anchorEl={el}
      open={Boolean(el)}
      onClose={handleClose}
      anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
      transitionDuration={0}
    >
      <Typography variant="caption" align="center" display="block">
        {service?.name}
      </Typography>
      <ComboButton className={css.button} connection={connection} service={service} />
      <Divider />
      <MenuItem onClick={handleClose}>
        <ListItemIcon>
          <Icon name="clipboard" color={clipboard.copied ? 'success' : undefined} size="md" fixedWidth />
        </ListItemIcon>
        Copy Link
      </MenuItem>
      <MenuItem onClick={handleClose}>My account</MenuItem>
      <MenuItem onClick={handleClose}>Logout</MenuItem>
    </Menu>
  )
}

const useStyles = makeStyles({
  menu: { backgroundColor: colors.grayLightest },
  button: { marginTop: spacing.xs, marginBottom: spacing.sm },
})
