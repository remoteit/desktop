import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import { DeviceContext } from '../services/Context'
import {
  DeviceWebsocket,
  WebsocketMode,
  graphQLDeviceWebsocket,
  websocketMode,
} from '../services/graphQLDeviceSettings'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { DeviceSettingChoice } from './DeviceSettingRow'
import { Confirm } from './Confirm'

// The reflector's state as the device reports it; none where it has not, or the API cannot say.
async function readWebsocket(deviceId: string): Promise<DeviceWebsocket | null> {
  const answer = await graphQLDeviceWebsocket(deviceId)
  return answer && typeof answer === 'object' ? answer : null
}

/* Whether the device uses remote.it's reflector (the websocket setting, device-package docs/device-settings.md): a
   three-way choice, set here or on the device. Off while the device reaches remote.it through the reflector strands it
   — no change made here reaches it after — so Off is asked first unless the device is known not to be using it.
   Absent where the API's device settings do not have it. */
export const DeviceWebsocketSetting: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const { setting, set } = useDeviceSettings(device?.id)
  const websocket = setting('websocket')
  const [state, setState] = useState<DeviceWebsocket | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const deviceId = websocket ? device?.id : undefined

  useEffect(() => {
    if (!deviceId) return
    let current = true
    readWebsocket(deviceId).then(answer => current && setState(answer))
    return () => {
      current = false
    }
  }, [deviceId])

  if (!device || !websocket) return null

  const apply = async (mode: WebsocketMode) => {
    setSaving(true)
    if (await set('websocket', mode)) setState(await readWebsocket(device.id))
    setSaving(false)
  }

  // Off strands a device that reaches remote.it through the reflector, so it is asked first — on the device's state
  // read again at the choice, else the last known; and, softer, where that state is unknown.
  const choose = async (mode: WebsocketMode) => {
    if (mode !== 'off') return apply(mode)
    setSaving(true)
    const now = (await readWebsocket(device.id)) ?? state
    setState(now)
    setSaving(false)
    if (now?.using === false) await apply(mode)
    else setConfirming(true)
  }

  return (
    <>
      <DeviceSettingChoice
        setting={websocket}
        icon="arrows-repeat"
        label={t('deviceWebsocket.label', 'Reflector (websocket)')}
        value={websocketMode(websocket)}
        choices={[
          {
            key: 'auto',
            name: t('deviceWebsocket.auto', 'Automatic'),
            description: t('deviceWebsocket.autoHint', 'Used only when this device’s UDP is blocked'),
          },
          {
            key: 'on',
            name: t('deviceWebsocket.on', 'Always'),
            description: t(
              'deviceWebsocket.onHint',
              'All traffic through remote.it’s reflector — for networks that block UDP'
            ),
          },
          {
            key: 'off',
            name: t('deviceWebsocket.off', 'Off'),
            description: t('deviceWebsocket.offHint', 'Never; with UDP blocked the device goes offline'),
          },
        ]}
        note={state?.using ? t('deviceWebsocket.using', 'Reaching remote.it through the reflector') : undefined}
        disabled={saving || !device.permissions.includes('MANAGE')}
        onChange={mode => choose(mode as WebsocketMode)}
      />
      <Confirm
        open={confirming}
        title={t('deviceWebsocket.offConfirm', 'Turn the reflector off?')}
        action={t('deviceWebsocket.offConfirmAction', 'Turn off')}
        color="error"
        onConfirm={() => {
          setConfirming(false)
          apply('off')
        }}
        onDeny={() => setConfirming(false)}
      >
        <Typography variant="body2">
          {state?.using
            ? t(
                'deviceWebsocket.offConfirmBody',
                'This device reaches remote.it through the reflector now. Turning it off disconnects it until someone changes it on the device.'
              )
            : t(
                'deviceWebsocket.offConfirmUnknown',
                "remote.it can't tell whether this device needs the reflector right now. If its UDP is blocked, turning it off disconnects it until someone changes it on the device."
              )}
        </Typography>
      </Confirm>
    </>
  )
}
