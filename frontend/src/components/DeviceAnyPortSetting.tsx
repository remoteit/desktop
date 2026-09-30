import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceContext } from '../services/Context'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { graphQLDeviceAnyPort, graphQLSetDeviceAnyPort } from '../services/graphQLDeviceNetworks'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'

type Ports = { tcp: string | null; udp: string | null }

/* A device's Any port setting (presence-server docs/device-principals.md §8): the ports of its own it takes beyond its
   services — * or ranges such as 502,20000-20100; empty for none. The ceiling its daemon enforces; a network that has
   it as a target with Any port on, or managing it, says who may use them. Behind the device-sessions flag, and absent
   where the API does not serve device sessions. */
export const DeviceAnyPortSetting: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const enabled = useDeviceSessions()
  const [ports, setPorts] = useState<Ports | null | undefined>()

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

  if (!enabled || !device || ports === undefined) return null

  const save = async (set: { tcp?: string; udp?: string }) => {
    const result = await graphQLSetDeviceAnyPort(device.id, set)
    if (result !== 'ERROR') setPorts(result.data?.data?.setDeviceAnyPort ?? null)
  }
  const disabled = !device.permissions.includes('MANAGE')

  return (
    <>
      <InlineTextFieldSetting
        icon="ethernet"
        label={t('deviceAnyPort.tcp', 'Any port (TCP)')}
        placeholder={t('deviceAnyPort.placeholder', '* or 502,20000-20100 — empty for none')}
        value={ports?.tcp || ''}
        resetValue={ports?.tcp || ''}
        disabled={disabled}
        onSave={value => save({ tcp: value?.toString() || '' })}
      />
      <InlineTextFieldSetting
        icon="ethernet"
        label={t('deviceAnyPort.udp', 'Any port (UDP)')}
        placeholder={t('deviceAnyPort.placeholder', '* or 502,20000-20100 — empty for none')}
        value={ports?.udp || ''}
        resetValue={ports?.udp || ''}
        disabled={disabled}
        onSave={value => save({ udp: value?.toString() || '' })}
      />
    </>
  )
}
