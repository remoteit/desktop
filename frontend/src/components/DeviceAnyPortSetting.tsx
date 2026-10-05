import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceContext } from '../services/Context'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { graphQLDeviceAnyPort, graphQLSetDeviceAnyPort } from '../services/graphQLDeviceNetworks'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { settingLocked } from '../services/graphQLDeviceSettings'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { ListItemSetting } from './ListItemSetting'
import { settingNote } from './DeviceSettingRow'

type Ports = { tcp: string | null; udp: string | null }

/* A device's Any port setting (presence-server docs/device-principals.md §8): the ports of its own it takes beyond its
   services — * or ranges such as 502,20000-20100; empty for none. The ceiling its daemon enforces; a network that has
   it as a target with Any port on, or managing it, says who may use them. A device setting (any_port) where the API
   has device settings — who set it on the device, or the administrator's override, said beneath — else its own field.
   Behind the device-sessions flag, and absent where the API does not serve device sessions. */
export const DeviceAnyPortSetting: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const enabled = useDeviceSessions()
  const [ports, setPorts] = useState<Ports | null | undefined>()
  const { setting, set } = useDeviceSettings(device?.id)
  const anyPort = setting('any_port')

  useEffect(() => {
    if (!enabled || !device?.id) return
    let current = true
    graphQLDeviceAnyPort(device.id).then(result => {
      if (current) setPorts(result === 'ERROR' || result === UNSUPPORTED ? undefined : result)
    })
    return () => {
      current = false
    }
  }, [enabled, device?.id])

  if (!enabled || !device || (!anyPort && ports === undefined)) return null

  // Turned off by the administrator, it takes none, whatever was set.
  const shown: Ports | null | undefined = anyPort
    ? anyPort.control === 'off'
      ? null
      : { tcp: anyPort.value?.tcp ?? null, udp: anyPort.value?.udp ?? null }
    : ports

  const save = async (change: { tcp?: string; udp?: string }) => {
    if (anyPort) {
      const next = { tcp: shown?.tcp || '', udp: shown?.udp || '', ...change }
      await set('any_port', next.tcp || next.udp ? next : null)
      return
    }
    const result = await graphQLSetDeviceAnyPort(device.id, change)
    if (result !== 'ERROR') setPorts(result.data?.data?.setDeviceAnyPort ?? null)
  }
  const disabled = !device.permissions.includes('MANAGE') || settingLocked(anyPort)
  const note = settingNote(t, anyPort)

  return (
    <>
      <InlineTextFieldSetting
        icon="ethernet"
        label={t('deviceAnyPort.tcp', 'Any port (TCP)')}
        placeholder={t('deviceAnyPort.placeholder', '* or 502,20000-20100 — empty for none')}
        value={shown?.tcp || ''}
        resetValue={shown?.tcp || ''}
        disabled={disabled}
        onSave={value => save({ tcp: value?.toString() || '' })}
      />
      <InlineTextFieldSetting
        icon="ethernet"
        label={t('deviceAnyPort.udp', 'Any port (UDP)')}
        placeholder={t('deviceAnyPort.placeholder', '* or 502,20000-20100 — empty for none')}
        value={shown?.udp || ''}
        resetValue={shown?.udp || ''}
        disabled={disabled}
        onSave={value => save({ udp: value?.toString() || '' })}
      />
      {note && <ListItemSetting icon={settingLocked(anyPort) ? 'lock' : 'user'} label={note} />}
    </>
  )
}
