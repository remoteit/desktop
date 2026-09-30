import React, { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { DeviceContext } from '../services/Context'
import { setDeviceUserMode } from '../services/deviceSessionInfo'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { ListItemSetting } from './ListItemSetting'

/* User mode (presence-server docs/device-principals.md §1): the device reaches everything the person who switched it
   on can, as well as what its networks grant it — a laptop's or a phone's usual mode. Not a privilege: it gives that
   person nothing they could not reach already. Only for a device you manage; switched on, it acts for you. Behind the
   device-sessions flag, and absent where the API does not serve device sessions. */
export const DeviceUserModeSetting: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const enabled = useDeviceSessions()
  const email = useSelector((state: State) => state.user.email)
  const info = useDeviceSessionInfo(enabled ? device?.id : undefined)
  const [saving, setSaving] = useState(false)

  // No name means the API does not serve device sessions (or the device is not visible): nothing to switch.
  if (!enabled || !device || !info?.subnetName) return null

  const on = !!info.actsFor
  const mine = info.actsFor === email

  return (
    <ListItemSetting
      icon="user"
      label={t('deviceUserMode.label', 'User mode')}
      subLabel={
        on
          ? mine
            ? t('deviceUserMode.onYou', 'Reaches everything you can, as well as what its networks grant it')
            : t('deviceUserMode.onOther', 'Reaches everything {{email}} can, as well as what its networks grant it', {
                email: info.actsFor,
              })
          : t('deviceUserMode.off', 'Reaches only what its networks grant it. On, it reaches everything you can too.')
      }
      toggle={on}
      disabled={saving || !device.permissions.includes('MANAGE')}
      onClick={async () => {
        setSaving(true)
        await setDeviceUserMode(device.id, !on)
        setSaving(false)
      }}
    />
  )
}
