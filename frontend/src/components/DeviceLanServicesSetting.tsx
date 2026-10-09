import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DeviceSettings } from '../hooks/useDeviceSettings'
import { DeviceSettingRow } from './DeviceSettingRow'

/* Connections through a phone (device-package docs/ios-lan-gateway-plan.md): a phone serves services — hosts on the
   network it is on — only while its lan_services setting is on; off by default, set here or in the phone's app. graphql
   serves the setting for client-only devices alone, so the row is absent on any other device and where the API's
   device settings do not have it. */
export const DeviceLanServicesSetting: React.FC<{ settings: DeviceSettings; canManage: boolean }> = ({
  settings,
  canManage,
}) => {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const lanServices = settings.setting('lan_services')

  if (!lanServices) return null

  return (
    <DeviceSettingRow
      setting={lanServices}
      icon="network-wired"
      label={t('deviceLanServices.label', 'Allow connections through this phone')}
      subLabel={t(
        'deviceLanServices.hint',
        'Others you share with can reach devices on the network this phone is on, while the VPN is on.'
      )}
      disabled={saving || !canManage}
      onChange={async on => {
        setSaving(true)
        await settings.set('lan_services', on)
        setSaving(false)
      }}
    />
  )
}
