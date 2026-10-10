import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DeviceSettings } from '../hooks/useDeviceSettings'
import { DeviceSettingRow } from './DeviceSettingRow'

/* Remote access to services on a phone's network (device-package docs/ios-lan-gateway-plan.md): a phone serves services
   — hosts on the network it is on — only while its lan_services setting is on; off by default. One setting, the
   device's (connectd's): set here from anywhere, as the cloud's side of it, or on the phone's This device page, where
   it is the third switch (thisDevice 1.3.0 lanServices); either side sets, the newer stands. graphql serves the
   setting for client-only devices alone, so the row is absent on any other device and where the API's device settings
   do not have it. */
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
      label={t('deviceLanServices.label', 'Allow remote access to services on the network')}
      subLabel={t(
        'deviceLanServices.hint',
        'People you share with can reach devices on the network this phone is on, through it.'
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
