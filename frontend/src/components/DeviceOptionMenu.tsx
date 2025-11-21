import React, { useState } from 'react'
import { PROTOCOL } from '../constants'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Divider, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { DeleteServiceMenuItem } from '../buttons/DeleteServiceMenuItem'
import { DeviceScriptingMenu } from './DeviceScriptingMenu'
import { ListItemLocation } from './ListItemLocation'
import { CopyMenuItem } from './CopyMenuItem'
import { DeleteDevice } from './DeleteDevice'
import { LeaveDevice } from './LeaveDevice'
import { InfoButton } from '../buttons/InfoButton'
import { IconButton } from '../buttons/IconButton'
import { MobileUI } from './MobileUI'
import { Icon } from './Icon'

type Props = { device?: IDevice; service?: IService; user?: IUser }

export const DeviceOptionMenu: React.FC<Props> = ({ device, service }) => {
  const { deviceID } = useParams<{ deviceID?: string }>()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const dispatch = useDispatch<Dispatch>()
  const devicesSection = !!deviceID
  const deviceOnly = device && !service

  if (!device) return null

  return (
    <>
      <MobileUI hide>{!devicesSection && <InfoButton device={device} service={service} />}</MobileUI>
      <IconButton onClick={handleClick} name="ellipsis-v" size="md" color="grayDarker" fixedWidth />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableScrollLock
        autoFocus={false}
        elevation={2}
      >
        <MobileUI>
          {device.permissions.includes('MANAGE') && (
            <MenuItem
              dense
              key="restore"
              to={`/devices/${device.id}/${service ? service.id + '/' : ''}share`}
              component={Link}
            >
              <ListItemIcon>
                <Icon name="share" size="md" />
              </ListItemIcon>
              <ListItemText primary="Share access" />
            </MenuItem>
          )}
        </MobileUI>
        {(!devicesSection || service) && (
          <ListItemLocation title="Device Details" icon="router" to={`/devices/${device.id}/details`} menuItem dense />
        )}
        {service && (
          <CopyMenuItem
            key="link"
            icon="link"
            title="Service Link"
            value={`${PROTOCOL}devices/${device.id}/${service.id}`}
            onCopied={handleClose}
          />
        )}
        {devicesSection && deviceOnly && (
          <CopyMenuItem
            key="link"
            icon="link"
            title="Device Link"
            value={`${PROTOCOL}devices/${device.id}`}
            onCopied={handleClose}
          />
        )}
        {device.permissions.includes('MANAGE') &&
          devicesSection &&
          deviceOnly && [
            <MenuItem
              dense
              key="restore"
              onClick={() => {
                handleClose()
                dispatch.ui.set({ showRestoreModal: true })
              }}
            >
              <ListItemIcon>
                <Icon name="wave-pulse" size="md" />
              </ListItemIcon>
              <ListItemText primary="Restore Device" />
            </MenuItem>,
            <MenuItem dense key="transfer" to={`/devices/${device.id}/transfer`} component={Link} onClick={handleClose}>
              <ListItemIcon>
                <Icon name="arrow-turn-down-right" size="md" />
              </ListItemIcon>
              <ListItemText primary="Transfer Device" />
            </MenuItem>,
          ]}
        {device.permissions.includes('MANAGE') &&
          devicesSection &&
          deviceOnly && [
            <Divider key="divider" />,
            <DeleteDevice key="deleteDevice" device={device} menuItem onClick={handleClose} onCancel={handleClose} />,
          ]}
        {device.permissions.includes('MANAGE') &&
          service &&
          devicesSection && [
            <Divider key="divider" />,
            <DeleteServiceMenuItem key="deleteService" device={device} service={service} />,
          ]}
        <LeaveDevice key="leaveDevice" device={device} menuItem />
      </Menu>
    </>
  )
}
