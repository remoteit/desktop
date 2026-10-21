import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Typography } from '@mui/material'
import { Dispatch } from '../store'
import { DeviceContext } from '../services/Context'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { Discovery, DiscoveryError, graphQLDiscover, offerService } from '../services/graphQLDiscovery'
import { DiscoveryList } from '../components/DiscoveryList'
import { AddAsVirtualDevice, discoveredMachine, mayHostVirtualDevices } from '../components/AddAsVirtualDevice'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { useVirtualDevices } from '../hooks/useVirtualDevices'
import { LoadingMessage } from '../components/LoadingMessage'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

/* What a device sees (graphql discover): what its network advertises and what listens on it, asked of the device as
   the page opens and again on refresh, each offered as a service to add. A device-session device's; the local scan
   (ScanPage) stays for this device on a legacy agent. */
export const DeviceDiscoverPage: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const [discovery, setDiscovery] = useState<Discovery | DiscoveryError | typeof UNSUPPORTED>()
  // Each machine it sees can be added as a virtual device it hosts, where it may host one.
  const virtualDevices = useVirtualDevices()
  const sessionDevice = !!useDeviceSessionInfo(virtualDevices && !device?.virtual ? device?.id : undefined)?.agent
    ?.running
  const hosts = !!device && virtualDevices && mayHostVirtualDevices(device, sessionDevice)

  const load = useCallback(async () => {
    if (!device?.id) return
    setDiscovery(undefined)
    setDiscovery(await graphQLDiscover(device.id))
  }, [device?.id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    dispatch.applicationTypes.fetchAll()
  }, [])

  if (!device) return null

  const body = () => {
    if (discovery === undefined)
      return <LoadingMessage message={t('discovery.asking', 'Asking the device what it sees...')} />
    if (discovery === UNSUPPORTED)
      return (
        <Notice severity="info" fullWidth>
          {t('discovery.unsupported', 'This API does not ask devices what they see.')}
        </Notice>
      )
    if ('error' in discovery)
      return (
        <Notice
          severity={discovery.error === 'OFFLINE' ? 'warning' : 'error'}
          fullWidth
          button={<IconButton icon="sync" title={t('discovery.tryAgain', 'Try again')} onClick={load} />}
        >
          {discovery.error === 'OFFLINE'
            ? t('discovery.offline', 'The device is offline: it can only be asked while it is online.')
            : discovery.error === 'NO_ANSWER'
            ? t('discovery.noAnswer', 'The device did not answer. Try again in a moment.')
            : t('discovery.error', 'Could not ask the device what it sees.')}
        </Notice>
      )
    return (
      <DiscoveryList
        discovery={discovery}
        services={device.services}
        onAdd={(offer, machineName) => {
          dispatch.ui.set({ setupAdded: offerService(offer, machineName) })
          history.push(`/devices/${device.id}/add`)
        }}
        machineAction={
          hosts
            ? machine => <AddAsVirtualDevice gatewayId={device.id} machine={discoveredMachine(machine)} />
            : undefined
        }
      />
    )
  }

  return (
    <Container
      integrated
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{t('discovery.title', 'What this device sees')}</Title>
            <IconButton
              icon="sync"
              title={t('discovery.refresh', 'Refresh')}
              spin={discovery === undefined}
              disabled={discovery === undefined}
              onClick={load}
            />
          </Typography>
          <Gutters top={null}>
            <Typography variant="body2" color="textSecondary">
              {t(
                'discovery.description',
                'What its network advertises and what listens on it, asked of the device now. Add any of them as a service.'
              )}
            </Typography>
          </Gutters>
        </>
      }
    >
      <Gutters size={null}>{body()}</Gutters>
    </Container>
  )
}
