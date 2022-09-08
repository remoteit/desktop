import React from 'react'
import { Link } from 'react-router-dom'
import { PROTOCOL } from '../shared/constants'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Divider, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { DeleteServiceMenuItem } from '../buttons/DeleteServiceMenuItem'
import { AddUserButton } from '../buttons/AddUserButton'
import { CopyMenuItem } from './CopyMenuItem'
import { DeleteDevice } from './DeleteDevice'
import { LeaveDevice } from './LeaveDevice'
import { Icon } from './Icon'

type Props = { device?: IDevice; service?: IService }

export const DeviceOptionMenu: React.FC<Props> = ({ device, service }) => {
  const userId = useSelector((state: ApplicationState) => state.auth.user?.id)
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  if (!device) return null

  const manage = userId === device.accountId || device.permissions.includes('MANAGE')

  return (
    <>
      <IconButton onClick={handleClick}>
        <Icon name="ellipsis-v" size="md" fixedWidth />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        disableScrollLock
        autoFocus={false}
        elevation={2}
      >
        {device.permissions.includes('MANAGE') && (
          <MenuItem
            dense
            to={`/devices/${device.id}/share`}
            component={Link}
            disabled={!device.permissions.includes('MANAGE')}
          >
            <ListItemIcon>
              <Icon name="user-plus" size="md" />
            </ListItemIcon>
            <ListItemText primary="Add User" />
          </MenuItem>
        )}
        {service ? (
          <CopyMenuItem icon="link" title="Service Link" value={`${PROTOCOL}device/${device.id}/${service?.id}`} />
        ) : (
          <CopyMenuItem icon="link" title="Device Link" value={`${PROTOCOL}devices/${device.id}`} />
        )}
        {manage && [
          <MenuItem
            dense
            key="transfer"
            to={`/devices/${device.id}/transfer`}
            component={Link}
            disabled={!device.permissions.includes('MANAGE')}
          >
            <ListItemIcon>
              <Icon name="share" size="md" />
            </ListItemIcon>
            <ListItemText primary="Transfer Device" />
          </MenuItem>,
          <Divider key="divider" />,
          <LeaveDevice key="leaveDevice" device={device} menuItem />,
          <DeleteDevice key="deleteDevice" device={device} menuItem />,
          <DeleteServiceMenuItem key="deleteService" device={device} service={service} />,
        ]}
      </Menu>
    </>
  )
}
