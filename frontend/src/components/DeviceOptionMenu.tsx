import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Divider, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { DeleteDeviceButton } from '../buttons/DeleteDeviceButton'
import { Icon } from './Icon'

type Props = { device?: IDevice }

export const DeviceOptionMenu: React.FC<Props> = ({ device }) => {
  const { userId } = useSelector((state: ApplicationState) => ({
    userId: state.auth.user?.id,
  }))
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  if (!device || !device.permissions.includes('MANAGE')) return null

  return (
    <div>
      <IconButton onClick={handleClick}>
        <Icon name="ellipsis-v" size="md" fixedWidth />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        getContentAnchorEl={null}
        disableScrollLock
        autoFocus={false}
        elevation={2}
      >
        <MenuItem dense to={`/devices/${device.id}/transfer`} component={Link} autoFocus={false} disableGutters>
          <ListItemIcon>
            <Icon name="share" size="md" />
          </ListItemIcon>
          <ListItemText primary="Transfer Device" />
        </MenuItem>
        <Divider />
        <DeleteDeviceButton device={device} menuItem />
      </Menu>
    </div>
  )
}
