import React from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
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
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <>
      <IconButton onClick={handleClick} color="primary" icon="ellipsis-v" size="md" inline />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        disableScrollLock
        autoFocus={false}
        elevation={2}
      >
        <div>
          <ForgetMenuItem connection={connection} onClick={handleClose} />
        </div>
        <MenuItem
          dense
          onClick={async () => {
            await dispatch.feedback.set({
              subject: `Connection Issue Report to ${connection?.name}`,
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
        <MenuItem dense onClick={() => history.push(`/settings/defaults/${service?.typeID}`)}>
          <ListItemIcon>
            <Icon name="square-dashed" size="md" />
          </ListItemIcon>
          <ListItemText primary="Edit Defaults" />
        </MenuItem>
      </Menu>
    </>
  )
}
