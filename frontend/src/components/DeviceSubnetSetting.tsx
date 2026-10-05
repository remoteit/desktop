import React, { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceContext } from '../services/Context'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { DeviceSettingRow } from './DeviceSettingRow'

/* The device's subnet interface, through which it reaches what it may by name and address, without starting a
   connection. A device setting (device-package docs/device-settings.md): absent where the API has no device settings,
   as behind the device-sessions flag. */
export const DeviceSubnetSetting: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const { setting, set } = useDeviceSettings(device?.id)
  const [saving, setSaving] = useState(false)
  const subnet = setting('subnet')

  if (!device || !subnet) return null

  return (
    <DeviceSettingRow
      setting={subnet}
      icon="chart-network"
      label={t('deviceSubnet.label', 'Device subnet')}
      subLabel={t('deviceSubnet.hint', 'Reaches what it may by name and address, without starting a connection')}
      disabled={saving || !device.permissions.includes('MANAGE')}
      onChange={async on => {
        setSaving(true)
        await set('subnet', on)
        setSaving(false)
      }}
    />
  )
}
