import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceContext } from '../services/Context'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { DeviceSection } from '../components/DeviceSection'
import { DeviceAbout } from '../components/DeviceAbout'
import { EventHeader } from '../components/EventList/EventHeader'
import { EventList } from '../components/EventList'
import { Gutters } from '../components/Gutters'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { useDeviceCarries } from '../hooks/useDeviceCarries'
import { DeviceExitFlows } from './DeviceExitFlowsPage'

export const DeviceActivityPage: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const deviceSessions = useDeviceSessions()
  const carries = useDeviceCarries(device)

  if (!device) return <DeviceHeaderMenu />

  return (
    <DeviceHeaderMenu>
      <Gutters size={null} top={null}>
        <DeviceSection id="log" title={t('deviceActivity.events', 'Events')} list={false}>
          <EventHeader device={device} />
          <EventList device={device} />
        </DeviceSection>
        {deviceSessions && !device.virtual && (
          <DeviceAbout deviceId={device.id} part="history" />
        )}
        {carries === false && <DeviceExitFlows device={device} />}
      </Gutters>
    </DeviceHeaderMenu>
  )
}
