import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { PROTOCOL } from '../shared/constants'
import { Divider, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material'
import { DeleteServiceMenuItem } from '../buttons/DeleteServiceMenuItem'
import { ListItemLocation } from './ListItemLocation'
import { CopyMenuItem } from './CopyMenuItem'
import { DeleteDevice } from './DeleteDevice'
import { LeaveDevice } from './LeaveDevice'
import { Icon } from './Icon'

type Props = { device?: IDevice; service?: IService; user?: IUser }

export const DeviceOptionMenu: React.FC<Props> = ({ device, service }) => {
  const { deviceID } = useParams<{ deviceID?: string }>()
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const devicePage = !!deviceID

  if (!device) return null

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
        {!devicePage && (
          <ListItemLocation
            title="Device Page"
            icon="router"
            pathname={`/devices/${device.id}/details`}
            menuItem
            dense
          />
        )}
        {service ? (
          <CopyMenuItem
            key="link"
            icon="link"
            title="Service Link"
            value={`${PROTOCOL}device/${device.id}/${service.id}`}
          />
        ) : (
          devicePage && (
            <CopyMenuItem key="link" icon="link" title="Device Link" value={`${PROTOCOL}devices/${device.id}`} />
          )
        )}
        {devicePage && device.permissions.includes('MANAGE') && (
          <>
            <MenuItem dense key="transfer" to={`/devices/${device.id}/transfer`} component={Link}>
              <ListItemIcon>
                <Icon name="arrow-turn-down-right" size="md" />
              </ListItemIcon>
              <ListItemText primary="Transfer Device" />
            </MenuItem>
            <Divider key="divider" />
            <DeleteServiceMenuItem key="deleteService" device={device} service={service} />
            <Tooltip
              title="Device must be offline"
              placement="left"
              open={device.state !== 'active' ? false : undefined}
              arrow
            >
              <span>
                <CopyMenuItem
                  key="restore"
                  icon="trash-arrow-up"
                  title="Restore Device"
                  value={device.restoreCommand || ''}
                  disabled={device.state === 'active'}
                />
                <DeleteDevice key="deleteDevice" device={device} menuItem />
              </span>
            </Tooltip>
          </>
        )}
        <LeaveDevice key="leaveDevice" device={device} menuItem />
      </Menu>
    </>
  )
}
