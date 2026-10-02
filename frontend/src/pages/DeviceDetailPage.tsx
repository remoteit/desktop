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
import { DeviceSshAccess } from '../components/DeviceSshAccess'

export const DeviceDetailPage: React.FC = () => {
  const { device } = useContext(DeviceContext)
  const accountLimits = useSelector((state: State) => selectLimitsLookup(state, device?.accountId))
  const deviceSessions = useSelector(selectDeviceSessions)
  const limits = useMemo(() => ({ ...accountLimits, deviceSessions }), [accountLimits, deviceSessions])
  const attributes = useSelector(selectDeviceDetailAttributes)

  return (
    <DeviceHeaderMenu>
      <GraphItem device={device} />
      <Gutters>
        <DataDisplay attributes={attributes} device={device} instance={device} limits={limits} />
        {deviceSessions && device && <DeviceAbout deviceId={device.id} />}
        {deviceSessions && device && <DeviceSshAccess deviceId={device.id} />}
      </Gutters>
    </DeviceHeaderMenu>
  )
}
