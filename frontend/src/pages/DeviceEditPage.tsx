import React, { useContext } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { DeviceContext } from '../services/Context'
import { DeviceDescriptionSetting } from '../components/DeviceDescriptionSetting'
import { DevicePresenceSetting } from '../components/DevicePresenceSetting'
import { DeviceUserModeSetting } from '../components/DeviceUserModeSetting'
import { DeviceAnyPortSetting } from '../components/DeviceAnyPortSetting'
import { DeviceSubnetSetting } from '../components/DeviceSubnetSetting'
import { DeviceWebsocketSetting } from '../components/DeviceWebsocketSetting'
import { DeviceLanServicesSetting } from '../components/DeviceLanServicesSetting'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { DeviceExitChoice } from '../components/DeviceExitSection'
import { DevicePolicyRow } from '../components/DeviceSettingRow'
import { NotificationSettings } from '../components/NotificationSettings'
import { DeviceNameSetting } from '../components/DeviceNameSetting'
import { DeviceSubnetLabelSetting } from '../components/DeviceSubnetLabelSetting'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { DeviceSshAccess } from '../components/DeviceSshAccess'
import { DeviceApps } from '../components/DeviceApps'
import { selectDeviceSessions } from '../hooks/useDeviceSessions'
import { Gutters } from '../components/Gutters'
import { List } from '@mui/material'

export const DeviceEditPage: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const deviceSessions = useSelector(selectDeviceSessions)
  const settings = useDeviceSettings(device?.id)

  return (
    <DeviceHeaderMenu>
      {device?.permissions.includes('MANAGE') && (
        <Gutters size={null}>
          <List>
            <DeviceNameSetting />
            <DeviceSubnetLabelSetting />
            <DeviceDescriptionSetting />
            <DevicePresenceSetting />
            <DeviceUserModeSetting />
            <DeviceSubnetSetting />
            {deviceSessions && <DeviceExitChoice device={device} />}
            <DeviceAnyPortSetting />
            <DeviceWebsocketSetting />
            <DeviceLanServicesSetting settings={settings} canManage={!!device?.permissions.includes('MANAGE')} />
            {deviceSessions && (
              <DevicePolicyRow
                deviceId={device.id}
                name="initiators"
                label={t('deviceSetting.initiators', 'Device sessions from this device')}
              />
            )}
          </List>
        </Gutters>
      )}
      {/* The device's apps and who may log in through its console: what is set on it, so with its settings. */}
      {deviceSessions && device && (
        <Gutters>
          <DeviceApps deviceId={device.id} canManage={!!device.permissions?.includes('MANAGE')} />
          <DeviceSshAccess deviceId={device.id} />
        </Gutters>
      )}
      <NotificationSettings />
    </DeviceHeaderMenu>
  )
}
