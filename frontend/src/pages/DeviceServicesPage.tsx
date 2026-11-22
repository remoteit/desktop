import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ListItemText, Typography } from '@mui/material'
import { Dispatch } from '../store'
import { DeviceContext } from '../services/Context'
import { servicesClosed } from '../services/graphQLDeviceSettings'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { useVirtualDevices } from '../hooks/useVirtualDevices'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { DeviceSection } from '../components/DeviceSection'
import { ListItemLocation } from '../components/ListItemLocation'
import { ServiceMiniState } from '../components/ServiceMiniState'
import { AppTerminalButton } from '../components/AppTerminal'
import { AddVirtualDeviceRow } from '../components/HostedDevices'
import { AddServiceButton } from '../buttons/AddServiceButton'
import { AddFromNetwork } from '../components/AddFromNetwork'
import { useProductHold } from '../components/DeviceProductNotice'
import { DeviceApps } from '../components/DeviceApps'
import { Gutters } from '../components/Gutters'
import { Icon } from '../components/Icon'

export const DeviceServicesPage: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const { device, connections } = useContext(DeviceContext)
  const deviceSessions = useDeviceSessions()
  const virtualDevices = useVirtualDevices()
  const closed = servicesClosed(useDeviceSettings(device?.virtual ? undefined : device?.id).setting('services'))
  const info = useDeviceSessionInfo(deviceSessions && device && !device.virtual ? device.id : undefined)
  const sessionDevice = !!info?.agent?.running
  const hold = useProductHold(device)

  if (!device) return <DeviceHeaderMenu />

  const manage = device.permissions.includes('MANAGE')
  const editable = device.thisDevice || ((device.configurable || !!device.virtual) && manage)
  const services = [...device.services].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <DeviceHeaderMenu>
      <Gutters size={null} top={null}>
        <DeviceSection
          id="services"
          title={t('deviceServices.title', 'Services')}
          action={
            <>
              {!device.virtual && (
                <AddFromNetwork allowScanning={device.thisDevice} discover={sessionDevice && manage} button />
              )}
              <AddServiceButton
                device={device}
                editable={editable && !closed && !hold.enforced}
                link={`/devices/${device.id}/add`}
              />
            </>
          }
        >
          {editable && closed && (
            <ListItemLocation to={`/devices/${device.id}/settings/services`} icon="network-wired" dense>
              <ListItemText
                primary={t('deviceServices.sharingOff', 'Sharing is off')}
                secondary={t('deviceServices.sharingOffNote', 'Turn on Share this device to add services.')}
              />
            </ListItemLocation>
          )}
          {services.map(service => {
            const connection = connections?.find(c => c.id === service.id)
            const address = info?.services?.[service.id]
            return (
              <ListItemLocation
                key={service.id}
                to={`/devices/${device.id}/${service.id}/connect`}
                icon={<Icon name={service.state === 'active' ? 'circle-play' : 'circle-pause'} size="md" />}
                onClick={() => dispatch.ui.setDefaultService({ deviceId: device.id, serviceId: service.id })}
                sx={{ paddingRight: 4.5 }}
                dense
              >
                <ListItemText
                  primary={service.name}
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <>
                      {[service.type, service.port && `${t('deviceServices.port', 'Port')} ${service.port}`]
                        .filter(Boolean)
                        .join(' · ')}
                      {address && (
                        <Typography
                          variant="caption"
                          component="div"
                          fontFamily="monospace"
                          color="grayDark.main"
                          sx={{ wordBreak: 'break-all' }}
                        >
                          {address}
                        </Typography>
                      )}
                    </>
                  }
                />
                <AppTerminalButton device={device} service={service} />
                <ServiceMiniState service={service} connection={connection} />
              </ListItemLocation>
            )
          })}
          {!services.length && (
            <ListItemText
              sx={{ paddingLeft: 9, paddingY: 1 }}
              secondary={t('deviceServices.none', 'No services yet.')}
            />
          )}
          {virtualDevices && !device.hostedDevices?.length && <AddVirtualDeviceRow device={device} />}
        </DeviceSection>
        {deviceSessions && !device.virtual && (
          <Gutters>
            <DeviceApps device={device} />
          </Gutters>
        )}
      </Gutters>
    </DeviceHeaderMenu>
  )
}
