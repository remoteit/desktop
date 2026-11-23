import React, { useContext } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { DeviceContext } from '../services/Context'
import { DeviceDescriptionSetting } from '../components/DeviceDescriptionSetting'
import { DevicePresenceSetting } from '../components/DevicePresenceSetting'
import { DeviceAccessSetting } from '../components/DeviceAccessSetting'
import { DeviceAnyPortSetting } from '../components/DeviceAnyPortSetting'
import { DeviceWebsocketSetting } from '../components/DeviceWebsocketSetting'
import { DeviceServicesSetting } from '../components/DeviceServicesSetting'
import { DeviceScriptsSetting } from '../components/DeviceScriptsSetting'
import { DeviceAiCommandsSetting } from '../components/DeviceAiCommandsSetting'
import { DeviceSharesConnection } from '../components/DeviceSharesConnection'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { DeviceExitChoice } from '../components/DeviceExitSection'
import { DevicePolicyRow } from '../components/DeviceSettingRow'
import { NotificationSettings } from '../components/NotificationSettings'
import { DeviceNameSetting } from '../components/DeviceNameSetting'
import { DeviceSubnetLabelSetting } from '../components/DeviceSubnetLabelSetting'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { DeviceSection } from '../components/DeviceSection'
import { DeviceSshAccess } from '../components/DeviceSshAccess'
import { DeviceSignIns } from '../components/DeviceSignIns'
import { DeviceJoinKeys } from '../components/DeviceJoinKeys'
import { DeviceAgentSection } from './DeviceAgentPage'
import { selectDeviceSessions } from '../hooks/useDeviceSessions'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from '../components/Gutters'
import { VirtualDeviceSettings } from '../components/VirtualDeviceSettings'
import { DeviceProductSetting } from '../components/DeviceProductSetting'

export const DeviceEditPage: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const deviceSessions = useSelector(selectDeviceSessions)
  const settings = useDeviceSettings(device?.id)

  if (!device) return null
  const manage = device.permissions.includes('MANAGE')

  const notificationDefaults = (
    <IconButton
      title={t('deviceSettings.notificationDefaults', 'Notification defaults')}
      to="/settings/notifications"
      icon="sliders-h"
      color="grayDark"
      size="sm"
      shiftDown
    />
  )

  const thisDevice = (
    <DeviceSection id="device" title={t('deviceSettings.thisDevice', 'This device')} action={notificationDefaults}>
      {manage && (
        <>
          <DeviceNameSetting />
          <DeviceDescriptionSetting />
          {device.virtual ? <VirtualDeviceSettings device={device} /> : <DeviceSubnetLabelSetting />}
        </>
      )}
      <NotificationSettings embedded />
    </DeviceSection>
  )

  if (device.virtual)
    return (
      <DeviceHeaderMenu>
        <Gutters size={null} top={null}>
          {thisDevice}
        </Gutters>
      </DeviceHeaderMenu>
    )

  return (
    <DeviceHeaderMenu>
      <Gutters size={null} top={null}>
        {thisDevice}
        {manage && deviceSessions && (
          <>
            <DeviceSection id="access" title={t('deviceSettings.accessTraffic', 'Access and traffic')}>
              <DeviceAccessSetting />
              <DeviceExitChoice device={device} />
              <DeviceAnyPortSetting />
              <DeviceWebsocketSetting />
            </DeviceSection>
            <DeviceSection id="services" title={t('deviceSettings.servicesSharing', 'Services and sharing')}>
              <DeviceServicesSetting settings={settings} canManage={manage} />
              <DeviceScriptsSetting settings={settings} canManage={manage} platform={device.targetPlatform} />
              <DeviceAiCommandsSetting device={device} />
            </DeviceSection>
            <DeviceSection id="terminal" title={t('deviceSshAccess.terminalAccess', 'Terminal access')} list={false}>
              <Gutters top={null} bottom={null} inset="icon">
                <DeviceSshAccess deviceId={device.id} untitled />
              </Gutters>
            </DeviceSection>
            <DeviceSection id="agent" title={t('deviceSettings.agent', 'Agent')}>
              <DeviceAgentSection />
            </DeviceSection>
            <DeviceSection id="advanced" title={t('deviceSettings.advanced', 'Advanced')}>
              <DeviceProductSetting device={device} />
              <DeviceSharesConnection device={device} />
              <DeviceSignIns deviceId={device.id} />
              <DevicePolicyRow
                deviceId={device.id}
                name="initiators"
                label={t('deviceSettings.outgoing', 'Connections from this device')}
              />
              <DevicePresenceSetting />
            </DeviceSection>
            <Gutters top="lg">
              <DeviceJoinKeys device={device} />
            </Gutters>
          </>
        )}
        {!manage && deviceSessions && (
          <DeviceSection id="access" title={t('deviceSettings.accessTraffic', 'Access and traffic')}>
            <DeviceAccessSetting />
          </DeviceSection>
        )}
      </Gutters>
    </DeviceHeaderMenu>
  )
}
