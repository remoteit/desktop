import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { DeviceContext } from '../services/Context'
import { settingLocked, settingOn } from '../services/graphQLDeviceSettings'
import { setDeviceUserMode } from '../services/deviceSessionInfo'
import { portalUserModeServed } from '../services/deviceSignIns'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import {
  ACCESS_LEVELS,
  AccessLevel,
  accessBlocked,
  accessDormant,
  accessLevel,
  accessSteps,
} from '../helpers/deviceAccess'
import { DevicePortalUserMode } from './DevicePortalUserMode'
import { lockedLine } from './DeviceSettingRow'
import { SelectSetting } from './SelectSetting'
import { CLOUD_TREE_RE, OAUTH_GRAPHQL_RESOURCE } from '../constants'

export const DeviceAccessSetting: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const enabled = useDeviceSessions()
  const me = useSelector((state: State) => state.user.email)
  const settings = useDeviceSettings(enabled ? device?.id : undefined)
  const info = useDeviceSessionInfo(enabled ? device?.id : undefined)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [portal, setPortal] = useState<boolean>()

  useEffect(() => {
    let current = true
    portalUserModeServed().then(served => current && setPortal(served === true))
    return () => {
      current = false
    }
  }, [])

  const subnet = settings.setting('subnet')
  const userMode = settings.setting('user_mode')
  if (!enabled || !device || !subnet) return null

  const manage = device.permissions.includes('MANAGE')
  // User mode is a level here only where the device has a name on your network and the per-account sign-ins are not
  // served; with them, its accounts are chosen below.
  const userModeHere = !!info?.subnetName && portal === false
  const reading = { subnet: settingOn(subnet), actsFor: userModeHere ? info?.actsFor ?? null : null }
  const level = accessLevel(reading)
  const locks = { subnet: settingLocked(subnet), userMode: userMode?.control === 'off' }
  const other = reading.actsFor && reading.actsFor !== me ? reading.actsFor : undefined

  const levels = ACCESS_LEVELS.filter(l => l !== 'full' || userModeHere)
  const name = (l: AccessLevel) =>
    l === 'off'
      ? t('deviceAccess.off', 'Off')
      : l === 'networks'
      ? t('deviceAccess.networks', 'Networks only')
      : t('deviceAccess.full', 'Full access as {{person}}', { person: me })
  const description = (l: AccessLevel) =>
    l === 'off'
      ? t('deviceAccess.offHint', "This device can't reach your other devices by name.")
      : l === 'networks'
      ? t('deviceAccess.networksHint', 'This device reaches what its networks allow.')
      : t('deviceAccess.fullHint', 'This device reaches every device you can reach.')

  const choices: ISelect[] = levels.map(l => ({
    key: l,
    name: name(l),
    description: l === 'full' && locks.userMode ? lockedLine(t, { ...userMode!, control: 'off' }) : description(l),
    disabled: accessBlocked(reading, me, l, locks),
  }))
  if (other && level === 'full')
    choices.push({ key: 'other', name: t('deviceAccess.fullOther', 'Full access as {{person}}', { person: other }) })

  const help = locks.subnet
    ? lockedLine(t, subnet)
    : accessDormant(reading)
    ? t('deviceAccess.dormant', 'Full access for {{person}} is waiting. It starts when Access is on.', {
        person: reading.actsFor,
      })
    : description(other && level === 'full' ? 'full' : level)

  const choose = async (to: AccessLevel) => {
    setSaving(true)
    setFailed(false)
    let ok = true
    for (const step of accessSteps(reading, me, to)) {
      ok = step.setting === 'subnet' ? await settings.set('subnet', step.on) : await setDeviceUserMode(device.id, step.on)
      if (!ok) break
    }
    setFailed(!ok)
    setSaving(false)
  }

  const stage = CLOUD_TREE_RE.exec(OAUTH_GRAPHQL_RESOURCE)?.[1]
  const command =
    stage && (stage === 'solo' || stage.startsWith('local')) ? `remoteit-device-${stage}` : 'remoteit-device'

  return (
    <>
      <SelectSetting
        icon="chart-network"
        label={t('deviceAccess.label', 'Access')}
        value={other && level === 'full' ? 'other' : level}
        values={choices}
        disabled={saving || !manage || (locks.subnet && !userModeHere)}
        helperText={failed ? t('deviceAccess.failed', "Couldn't change Access. Try again.") : help}
        FormHelperTextProps={{ error: failed }}
        onChange={value => value !== 'other' && value !== level && choose(value as AccessLevel)}
        data-device-access
      />
      {portal && <DevicePortalUserMode key={device.id} deviceId={device.id} legacy={null} command={command} />}
    </>
  )
}
