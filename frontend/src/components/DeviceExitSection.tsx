import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListSubheader } from '@mui/material'
import { ExitInfo, graphQLDeviceExit, graphQLExits, graphQLSetDeviceExit } from '../services/graphQLProxy'
import { ListItemSetting } from './ListItemSetting'
import { SelectSetting } from './SelectSetting'

/* A device and exit nodes (presence-server docs/proxy-plan.md §8): the exit its traffic goes out through — one you may
   use, chosen here — and whether it offers itself as one, which it says by its own configuration. Device sessions
   only; nothing shows where the API lacks them. */
export const DeviceExitSection: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const [info, setInfo] = useState<ExitInfo | null>()
  const [exits, setExits] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const manage = device.permissions.includes('MANAGE')

  const load = useCallback(async () => {
    const answer = await graphQLDeviceExit(device.id)
    setInfo(answer && typeof answer === 'object' ? answer : null)
    const list = await graphQLExits()
    if (Array.isArray(list)) setExits(list.filter(e => e.id !== device.id))
  }, [device.id])

  useEffect(() => {
    load()
  }, [load])

  if (!info) return null

  const current = info.exit?.id || ''
  const choices = [
    { key: '', name: t('deviceExit.none', 'None — its usual way out') },
    ...exits.map(e => ({ key: e.id, name: e.name })),
  ]
  if (info.exit && !exits.some(e => e.id === info.exit?.id)) choices.push({ key: info.exit.id, name: info.exit.name })

  return (
    <List>
      <ListSubheader>{t('deviceExit.title', 'Exit node')}</ListSubheader>
      {manage && (
        <SelectSetting
          icon="arrow-right-from-bracket"
          label={t('deviceExit.via', 'Send its traffic out through')}
          value={current}
          values={choices}
          disabled={saving}
          helpMessage={t(
            'deviceExit.viaHint',
            'All of this device’s traffic leaves through the exit — and stops, rather than going its usual way, while the exit cannot be reached.'
          )}
          onChange={async via => {
            setSaving(true)
            if ((await graphQLSetDeviceExit(device.id, via || null)) !== 'ERROR') await load()
            setSaving(false)
          }}
        />
      )}
      <ListItemSetting
        icon="door-open"
        label={
          info.offersExit
            ? t('deviceExit.offers', 'Offers itself as an exit node')
            : t('deviceExit.offersNot', 'Not an exit node')
        }
        subLabel={
          info.offersExit
            ? t(
                'deviceExit.offersHint',
                'People you allow (its share or role says exit) can send their traffic out through it'
              )
            : t('deviceExit.offersNotHint', 'On the device: sudo remoteit-device exit-node on')
        }
      />
    </List>
  )
}
