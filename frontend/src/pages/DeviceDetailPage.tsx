import React, { useContext, useMemo, useState } from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Collapse, Stack, Typography } from '@mui/material'
import { TargetPlatform } from '../components/TargetPlatform'
import { DeviceContext } from '../services/Context'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { selectDeviceDetailAttributes } from '../selectors/devices'
import { selectLimitsLookup } from '../selectors/organizations'
import { selectDeviceSessions } from '../hooks/useDeviceSessions'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { useDeviceApps } from '../hooks/useDeviceApps'
import { DataDisplay } from '../components/DataDisplay'
import { GraphItem } from '../components/GraphItem'
import { Gutters } from '../components/Gutters'
import { DeviceAbout } from '../components/DeviceAbout'
import { DeviceSection } from '../components/DeviceSection'
import { ListItemSetting } from '../components/ListItemSetting'
import { HostedDevices } from '../components/HostedDevices'
import { HostedByLine } from '../components/HostedBy'
import { AppTerminalAction } from '../components/AppTerminal'
import { Timestamp } from '../components/Timestamp'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { selectVirtualDevices } from '../hooks/useVirtualDevices'
import { platforms } from '../platforms'

const DAEMON_ATTRIBUTES = [
  'quality',
  'qualitySmall',
  'configurable',
  'version',
  'hardwareId',
  'lastReported',
  'externalAddress',
  'internalAddress',
  'isp',
  'connectionType',
  'location',
  'agent',
]

const SHOWN_SERVICES = 4

export const DeviceDetailPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const { device } = useContext(DeviceContext)
  const accountLimits = useSelector((state: State) => selectLimitsLookup(state, device?.accountId))
  const deviceSessions = useSelector(selectDeviceSessions)
  const virtualDevices = useSelector(selectVirtualDevices)
  const info = useDeviceSessionInfo(deviceSessions && device && !device.virtual ? device.id : undefined)
  const { apps } = useDeviceApps(deviceSessions && device && !device.virtual ? device.id : undefined, {
    offers: false,
    accountId: device?.accountId,
  })
  const [details, setDetails] = useState(false)
  const limits = useMemo(
    () => ({ ...accountLimits, deviceSessions, virtualDevices }),
    [accountLimits, deviceSessions, virtualDevices]
  )
  const allAttributes = useSelector(selectDeviceDetailAttributes)

  if (!device) return <DeviceHeaderMenu />

  const attributes = device.virtual ? allAttributes.filter(a => !DAEMON_ATTRIBUTES.includes(a.id)) : allAttributes
  const address = device.virtual ? device.host : info?.subnetName
  const services = device.services.filter(s => s.state === 'active').slice(0, SHOWN_SERVICES)
  const terminal = apps
    ?.filter(app => app.state === 'running')
    .flatMap(app => app.services.map(service => ({ app, service })))
  const online = device.state === 'active'
  const hosting = !device.virtual && !!device.hostedDevices?.length

  return (
    <DeviceHeaderMenu>
      <Gutters size={null} top={null}>
        <DeviceSection id="status" title={t('deviceOverview.status', 'Status')}>
          <ListItemSetting
            icon={online ? 'circle-check' : 'circle-xmark'}
            iconColor={online ? 'success' : 'grayDark'}
            label={
              device.disabled
                ? t('deviceOverview.disabled', 'Disabled')
                : online
                ? t('deviceOverview.online', 'Online')
                : t('deviceOverview.offline', 'Offline')
            }
            subLabel={
              !online && device.lastReported ? (
                <>
                  {t('deviceOverview.lastSeen', 'Last seen')} <Timestamp date={new Date(device.lastReported)} />
                </>
              ) : undefined
            }
          />
          {address && (
            <ListItemSetting
              icon="globe"
              label={
                <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {address}
                </Typography>
              }
              subLabel={
                device.virtual
                  ? t('deviceOverview.virtualAddress', "Address on the gateway's network")
                  : t('deviceOverview.address', 'Address')
              }
              secondaryContent={
                <CopyIconButton value={address} size="md" title={t('deviceOverview.copyAddress', 'Copy address')} />
              }
            />
          )}
          {device.virtual && (
            <ListItemSetting
              icon="arrow-turn-down"
              label={<HostedByLine device={device} link />}
              subLabel={t('deviceOverview.gateway', 'Reached through this gateway')}
            />
          )}
          <ListItemSetting
            icon={<TargetPlatform id={device.targetPlatform} size="md" />}
            label={platforms.name(device.targetPlatform) || t('deviceOverview.unknownPlatform', 'Unknown platform')}
            subLabel={t('deviceOverview.ownedBy', 'Owned by {{owner}}', { owner: device.owner?.email })}
          />
        </DeviceSection>

        {(!!services.length || !!terminal?.length) && !device.disabled && (
          <DeviceSection id="actions" title={t('deviceOverview.doNow', 'Open')} list={false}>
            <Gutters top="sm" bottom="sm" size="xl" sx={{ paddingLeft: '44px' }}>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {terminal?.map(({ app, service }) => (
                  <AppTerminalAction key={`${app.id} ${service.serviceId}`} device={device} app={app} service={service} />
                ))}
                {services.map(service => (
                  <Button
                    key={service.id}
                    size="small"
                    variant="outlined"
                    data-open-service={service.id}
                    onClick={() => history.push(`/devices/${device.id}/${service.id}/connect`)}
                  >
                    {t('deviceOverview.openService', 'Open {{service}}', { service: service.name })}
                  </Button>
                ))}
                {device.services.length > SHOWN_SERVICES && (
                  <Button size="small" onClick={() => history.push(`/devices/${device.id}/services`)}>
                    {t('deviceOverview.allServices', 'All services')}
                  </Button>
                )}
              </Stack>
            </Gutters>
          </DeviceSection>
        )}

        {hosting && <HostedDevices device={device} />}

        <DeviceSection
          id="details"
          list={false}
          title={t('deviceOverview.details', 'Details')}
          action={
            <Button size="small" onClick={() => setDetails(!details)} data-overview-details>
              {details ? t('deviceOverview.hideDetails', 'Hide') : t('deviceOverview.showDetails', 'Show')}
            </Button>
          }
        >
          <Collapse in={details} unmountOnExit>
            <GraphItem device={device} />
            <Gutters>
              <DataDisplay attributes={attributes} device={device} instance={device} limits={limits} />
              {!device.virtual && deviceSessions && <DeviceAbout deviceId={device.id} part="about" />}
            </Gutters>
          </Collapse>
        </DeviceSection>
      </Gutters>
    </DeviceHeaderMenu>
  )
}
