import React, { useState } from 'react'
import { PROTOCOL } from '../constants'
import { Dispatch } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useHistory } from 'react-router-dom'
import { Divider, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material'
import { selectPermissions } from '../selectors/organizations'
import { DeleteServiceMenuItem } from '../buttons/DeleteServiceMenuItem'
import { ListItemLocation } from './ListItemLocation'
import { CopyMenuItem } from './CopyMenuItem'
import { DeleteDevice } from './DeleteDevice'
import { DisableDevice } from './DisableDevice'
import { DecommissionMenuItem, RestoreDisabledMenuItem } from './DisabledDeviceMenuItems'
import { useDeviceDisable } from '../hooks/useDeviceDisable'
import { LeaveDevice } from './LeaveDevice'
import { InfoButton } from '../buttons/InfoButton'
import { IconButton } from '../buttons/IconButton'
import { MobileUI } from './MobileUI'
import { Icon } from './Icon'
import { useVirtualDevices } from '../hooks/useVirtualDevices'
import { jumpHost } from '../helpers/virtualDeviceHelper'
import { openVirtualDeviceAdd } from './HostedDevices'
import { VirtualDevicePrefill } from './VirtualDeviceForm'

type Props = { device?: IDevice; service?: IService; user?: IUser }

export const DeviceOptionMenu: React.FC<Props> = ({ device, service }) => {
  const { deviceID } = useParams<{ deviceID?: string }>()
  const history = useHistory()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const dispatch = useDispatch<Dispatch>()
  const admin = useSelector(selectPermissions).includes('ADMIN')
  const { t } = useTranslation()
  const devicesSection = !!deviceID
  const deviceOnly = device && !service
  const virtualDevices = useVirtualDevices()
  const disable = useDeviceDisable()

  if (!device) return null

  // A disabled device offers Restore and Decommission… in place of what it can't do while disabled.
  const disabled = !!device.disabled
  const manage = device.permissions.includes('MANAGE') && !disabled

  const handleMakeProduct = async () => {
    handleClose()
    const product = await dispatch.products.createFromRegistration({
      platform: device.targetPlatform,
      tags: device.tags?.map(t => t.name),
      services: device.services.map(s => ({
        application: s.typeID,
        name: s.name,
        port: s.port,
        enabled: s.enabled,
      })),
    })
    if (product) history.push(`/products/${product.id}/details`)
  }

  // Only wrapped in a tooltip when disabled — MenuList arrow-key traversal skips a
  // span-wrapped item, so an enabled one has to stay a direct child of the Menu.
  const makeProductItem = (
    <MenuItem dense key="makeProduct" disabled={!admin} onClick={handleMakeProduct}>
      <ListItemIcon>
        <Icon name="conveyor-belt-boxes" size="md" />
      </ListItemIcon>
      <ListItemText primary={t('deviceOptionMenu.makeProduct', 'Make Product')} />
    </MenuItem>
  )

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
          {manage && (
            <MenuItem
              dense
              key="restore"
              to={`/devices/${device.id}/${service ? service.id + '/' : ''}share`}
              component={Link}
            >
              <ListItemIcon>
                <Icon name="share" size="md" />
              </ListItemIcon>
              <ListItemText primary={t('deviceOptionMenu.shareAccess', 'Share access')} />
            </MenuItem>
          )}
        </MobileUI>
        {(!devicesSection || service) && (
          <ListItemLocation
            title={t('deviceOptionMenu.deviceDetails', 'Device Details')}
            icon="router"
            to={`/devices/${device.id}/details`}
            menuItem
            dense
          />
        )}
        {service && (
          <CopyMenuItem
            key="link"
            icon="link"
            title={t('deviceOptionMenu.serviceLink', 'Service Link')}
            value={`${PROTOCOL}devices/${device.id}/${service.id}`}
            onCopied={handleClose}
          />
        )}
        {devicesSection && deviceOnly && (
          <CopyMenuItem
            key="link"
            icon="link"
            title={t('deviceOptionMenu.deviceLink', 'Device Link')}
            value={`${PROTOCOL}devices/${device.id}`}
            onCopied={handleClose}
          />
        )}
        {manage &&
          devicesSection &&
          deviceOnly && [
            !device.virtual && (
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
                <ListItemText primary={t('deviceOptionMenu.restoreDevice', 'Restore Device')} />
              </MenuItem>
            ),
            <MenuItem dense key="transfer" to={`/devices/${device.id}/transfer`} component={Link} onClick={handleClose}>
              <ListItemIcon>
                <Icon name="arrow-turn-down-right" size="md" />
              </ListItemIcon>
              <ListItemText primary={t('deviceOptionMenu.transferDevice', 'Transfer Device')} />
            </MenuItem>,
            device.virtual ? null : admin ? (
              makeProductItem
            ) : (
              <Tooltip
                key="makeProduct"
                placement="left"
                title={t('deviceOptionMenu.adminRequired', 'Admin permissions required')}
                arrow
              >
                <span>{makeProductItem}</span>
              </Tooltip>
            ),
          ]}
        {devicesSection &&
          deviceOnly &&
          disabled && [
            <Divider key="divider" />,
            <RestoreDisabledMenuItem key="restoreDisabled" device={device} onClick={handleClose} />,
            <DecommissionMenuItem key="decommission" device={device} onClick={handleClose} />,
          ]}
        {manage &&
          devicesSection &&
          deviceOnly && [
            <Divider key="divider" />,
            // This machine's own device is unregistered through its agent, as before.
            disable && !device.thisDevice ? (
              <DisableDevice key="disableDevice" device={device} onClick={handleClose} onCancel={handleClose} />
            ) : disable !== undefined || device.thisDevice ? (
              <DeleteDevice key="deleteDevice" device={device} menuItem onClick={handleClose} onCancel={handleClose} />
            ) : null,
          ]}
        {virtualDevices && service && !disabled && (
          <MakeVirtualDeviceItem device={device} service={service} onClick={handleClose} />
        )}
        {manage &&
          service &&
          devicesSection && [
            <Divider key="divider" />,
            <DeleteServiceMenuItem
              key="deleteService"
              device={device}
              service={service}
              onClick={handleClose}
              onCancel={handleClose}
            />,
          ]}
        <LeaveDevice key="leaveDevice" device={device} menuItem />
      </Menu>
    </>
  )
}

/* A jump service's "Make a virtual device for <host>…": the add form, prefilled, with every service of the gateway on
   that host ticked — they move with their shares and grants (graphql convertJumpService). Offered, never forced. */
const MakeVirtualDeviceItem: React.FC<{ device: IDevice; service: IService; onClick: () => void }> = ({
  device,
  service,
  onClick,
}) => {
  const { t } = useTranslation()
  const history = useHistory()
  const host = jumpHost(service)
  if (!host || device.virtual || !device.permissions.includes('MANAGE')) return null

  const prefill: VirtualDevicePrefill = {
    gatewayId: device.id,
    fromServiceId: service.id,
    name: host.replace(/\.local\.?$/, ''),
    host,
    services: device.services
      .filter(s => s.host === host)
      .map(s => ({ name: s.name, application: s.typeID, port: s.port || 1, protocol: s.protocol, checked: true })),
  }

  return (
    <MenuItem
      dense
      onClick={() => {
        onClick()
        openVirtualDeviceAdd(history, prefill)
      }}
    >
      <ListItemIcon>
        <Icon name="arrow-turn-down" rotate={270} size="md" />
      </ListItemIcon>
      <ListItemText
        primary={t('deviceOptionMenu.makeVirtualDevice', { host, defaultValue: 'Make a virtual device for {{host}}…' })}
      />
    </MenuItem>
  )
}
