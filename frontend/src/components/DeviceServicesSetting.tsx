import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DeviceSettings } from '../hooks/useDeviceSettings'
import { DeviceSettingRow } from './DeviceSettingRow'

/* Allow remote access to services (device-package docs/one-app-plan.md "Services"): whether the device serves its
   services — lets people reach the hosts and ports defined as its services, through it; off, none are, nor its ports
   beyond them or its console. Every device's: on by default, off on a phone, whose services are hosts on the network
   it is on. One setting, the device's (connectd's): set here from anywhere, as the cloud's side of it, or on the
   machine — the This device page's switch (thisDevice 1.4.0 services), the menu's — either side sets, the newer
   stands. Absent where the API's device settings do not have it. */
export const DeviceServicesSetting: React.FC<{ settings: DeviceSettings; canManage: boolean }> = ({
  settings,
  canManage,
}) => {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const services = settings.setting('services')

  if (!services) return null

  return (
    <DeviceSettingRow
      setting={services}
      icon="network-wired"
      label={t('deviceServices.label', 'Allow remote access to services')}
      subLabel={t(
        'deviceServices.hint',
        'People you share with can reach the services defined on this device, through it. Off, none are served — nor its ports beyond them or its console.'
      )}
      disabled={saving || !canManage}
      onChange={async on => {
        setSaving(true)
        await settings.set('services', on)
        setSaving(false)
      }}
    />
  )
}
