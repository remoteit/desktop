import React from 'react'
import { useHistory, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { ForgetMenuItem } from './ForgetMenuItem'
import { IconButton } from '../buttons/IconButton'
import { Icon } from './Icon'

type Props = {
  connection?: IConnection
  service?: IService
}

export const ConnectionMenu: React.FC<Props> = ({ connection, service }) => {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const hadLink = connection?.host?.includes('connect.remote.it')
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <>
      <IconButton onClick={handleClick} icon="ellipsis-v" buttonBaseSize="small" inline />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        disableScrollLock
        autoFocus={false}
        elevation={2}
      >
        <ForgetMenuItem connection={connection} onClick={handleClose} />
        <MenuItem
          dense
          onClick={async () => {
            await dispatch.feedback.set({
              subject: `Connection Issue Report for ${connection?.name}`,
              data: connection,
            })
            handleClose()
            history.push('/feedback')
          }}
        >
          <ListItemIcon>
            <Icon name="flag" size="md" />
          </ListItemIcon>
          <ListItemText primary="Report Issue" />
        </MenuItem>
        {hadLink && (
          <MenuItem
            dense
            onClick={() =>
              dispatch.ui.set({
                confirm: {
                  id: 'destroyLink',
                  callback: () => {
                    dispatch.connections.removeConnectLink(connection)
                    handleClose()
                  },
                },
              })
            }
          >
            <ListItemIcon>
              <Icon name="trash" size="md" />
            </ListItemIcon>
            <ListItemText primary="Forget persistent public url" />
          </MenuItem>
        )}
      </Menu>
    </>
  )
}
