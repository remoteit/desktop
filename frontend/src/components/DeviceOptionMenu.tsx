import React from 'react'
import { Link } from 'react-router-dom'
import { PROTOCOL } from '../shared/constants'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Divider, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { DeleteServiceMenuItem } from '../buttons/DeleteServiceMenuItem'
import { DeleteDevice } from '../buttons/DeleteDevice'
import { CopyMenuItem } from './CopyMenuItem'
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
        <div>
          {service ? (
            <CopyMenuItem icon="link" title="Service Link" value={`${PROTOCOL}device/${device.id}/${service?.id}`} />
          ) : (
            <CopyMenuItem icon="link" title="Device Link" value={`${PROTOCOL}devices/${device.id}`} />
          )}
        </div>
        {manage && [
          <MenuItem
            dense
            key="transfer"
            to={`/devices/${device.id}/transfer`}
            component={Link}
            autoFocus={false}
            disabled={!device.permissions.includes('MANAGE')}
          >
            <ListItemIcon>
              <Icon name="share" size="md" />
            </ListItemIcon>
            <ListItemText primary="Transfer Device" />
          </MenuItem>,
          <Divider key="divider" />,
          <DeleteDevice key="deleteDevice" device={device} menuItem />,
          <DeleteServiceMenuItem key="deleteService" device={device} service={service} />,
        ]}
      </Menu>
    </>
  )
}
