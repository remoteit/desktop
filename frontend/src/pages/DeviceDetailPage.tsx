import React, { useContext, useMemo } from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { DeviceContext } from '../services/Context'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { selectDeviceDetailAttributes } from '../selectors/devices'
import { selectLimitsLookup } from '../selectors/organizations'
import { selectDeviceSessions } from '../hooks/useDeviceSessions'
import { DataDisplay } from '../components/DataDisplay'
import { GraphItem } from '../components/GraphItem'
import { Gutters } from '../components/Gutters'
import { DeviceAbout } from '../components/DeviceAbout'
import { DeviceHosting } from '../components/DeviceHosting'
import { selectVirtualDevices } from '../hooks/useVirtualDevices'

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

export const DeviceDetailPage: React.FC = () => {
  const { device } = useContext(DeviceContext)
  const accountLimits = useSelector((state: State) => selectLimitsLookup(state, device?.accountId))
  const deviceSessions = useSelector(selectDeviceSessions)
  const virtualDevices = useSelector(selectVirtualDevices)
  const limits = useMemo(
    () => ({ ...accountLimits, deviceSessions, virtualDevices }),
    [accountLimits, deviceSessions, virtualDevices]
  )
  const allAttributes = useSelector(selectDeviceDetailAttributes)
  // A virtual device reports nothing of its own: what a daemon would say of it is left out.
  const attributes = device?.virtual ? allAttributes.filter(a => !DAEMON_ATTRIBUTES.includes(a.id)) : allAttributes

  return (
    <DeviceHeaderMenu>
      <GraphItem device={device} />
      <Gutters>
        <DataDisplay attributes={attributes} device={device} instance={device} limits={limits} />
        {device?.virtual ? (
          <DeviceHosting device={device} />
        ) : (
          deviceSessions && device && <DeviceAbout deviceId={device.id} />
        )}
      </Gutters>
    </DeviceHeaderMenu>
  )
}
