import React from 'react'
import { emit } from '../services/Controller'
import { Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { clearConnectionError } from '../helpers/connectionHelper'
import { IconButton } from '../buttons/IconButton'
import { DesktopUI } from './DesktopUI'
import { Icon } from './Icon'

type Props = {
  connection: IConnection
}

export const ConnectionErrorMenu: React.FC<Props> = ({ connection }) => {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <>
      <IconButton onClick={handleClick} icon="ellipsis-v" inline />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        disableScrollLock
        MenuListProps={{ sx: { bgcolor: 'error.main' } }}
        autoFocus={false}
        elevation={2}
      >
        <MenuItem
          dense
          onClick={async () => {
            await dispatch.feedback.set({
              subject: `Connection Issue Report for ${connection?.name}`,
              data: connection,
            })
            history.push('/feedback')
          }}
        >
          <ListItemIcon>
            <Icon name="flag" size="md" color="alwaysWhite" />
          </ListItemIcon>
          <ListItemText primary="Report Issue" />
        </MenuItem>
        <MenuItem dense onClick={() => clearConnectionError(connection)}>
          <ListItemIcon>
            <Icon name="trash" size="md" color="alwaysWhite" />
          </ListItemIcon>
          <ListItemText primary="Clear error" />
        </MenuItem>
        <DesktopUI>
          <MenuItem dense onClick={() => emit('service/clearErrors')}>
            <ListItemIcon>
              <Icon name="broom-wide" size="md" color="alwaysWhite" />
            </ListItemIcon>
            <ListItemText primary="Clear all errors" />
          </MenuItem>
        </DesktopUI>
      </Menu>
    </>
  )
}
