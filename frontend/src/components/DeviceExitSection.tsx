import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { List, ListSubheader } from '@mui/material'
import {
  ExitChooser,
  ExitInfo,
  graphQLDeviceExit,
  graphQLDeviceExitChooser,
  graphQLExits,
  graphQLSetDeviceExit,
} from '../services/graphQLProxy'
import { ListItemSetting } from './ListItemSetting'
import { SelectSetting } from './SelectSetting'

/* A device and exit nodes (presence-server docs/proxy-plan.md §8): the exit its traffic goes out through — one you may
   use, chosen here — and whether it offers itself as one, which it says by its own configuration. Device sessions
   only; nothing shows where the API lacks them. */
export const DeviceExitSection: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const [info, setInfo] = useState<ExitInfo | null>()
  const [chooser, setChooser] = useState<ExitChooser | null>(null)
  const [exits, setExits] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const manage = device.permissions.includes('MANAGE')

  const load = useCallback(async () => {
    const answer = await graphQLDeviceExit(device.id)
    setInfo(answer && typeof answer === 'object' ? answer : null)
    const who = await graphQLDeviceExitChooser(device.id)
    setChooser(who && typeof who === 'object' ? who : null)
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

  // The machine's administrator's policy holds over the portal: under local or never, nothing is chosen here.
  const policy = chooser?.exitPolicy
  const locked = policy === 'local' || policy === 'never'
  const chosenBy = info.exit ? chosenLine(t, chooser) : null
  const policyText = policyLine(t, chooser)

  return (
    <List>
      <ListSubheader>{t('deviceExit.title', 'Exit node')}</ListSubheader>
      {manage && (
        <SelectSetting
          icon="arrow-right-from-bracket"
          label={t('deviceExit.via', 'Send its traffic out through')}
          value={current}
          values={choices}
          disabled={saving || locked}
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
      {chosenBy && <ListItemSetting icon="user" label={chosenBy} />}
      {policyText && <ListItemSetting icon="lock" label={policyText.label} subLabel={policyText.hint} />}
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

type T = TFunction

// Who chose the exit in force: someone on the device (its OS user, when the device said), or a person in the portal.
export function chosenLine(t: T, chooser: ExitChooser | null): string | null {
  if (!chooser) return null
  if (chooser.exitSetOnDevice) {
    return chooser.exitSetOnDeviceBy
      ? t('deviceExit.setOnDeviceBy', 'Set on the device by {{name}}', { name: chooser.exitSetOnDeviceBy })
      : t('deviceExit.setOnDevice', 'Set on the device')
  }
  if (chooser.exitSetBy?.email) return t('deviceExit.setBy', 'Set by {{email}}', { email: chooser.exitSetBy.email })
  return null
}

// What the machine's administrator decided of its exit on the device, if anything.
export function policyLine(t: T, chooser: ExitChooser | null): { label: string; hint?: string } | null {
  if (!chooser) return null
  if (chooser.exitPolicy === 'never')
    return {
      label: t('deviceExit.policyNever', 'This machine’s administrator allows it no exit'),
      hint: t('deviceExit.policyHint', 'Set on the device: sudo remoteit-device policy'),
    }
  if (chooser.exitPolicy === 'local')
    return {
      label: t('deviceExit.policyLocal', 'This machine’s administrator keeps its exit local'),
      hint: t('deviceExit.policyLocalHint', 'Its exit is chosen on the device only; the portal cannot change it'),
    }
  if (chooser.exitPinned)
    return {
      label: t('deviceExit.policyPinned', 'Pinned by this machine’s administrator to {{id}}', {
        id: chooser.exitPinned,
      }),
      hint: t('deviceExit.policyPinnedHint', 'The pinned exit holds over any chosen here'),
    }
  if (chooser.exitAllowed)
    return {
      label: t('deviceExit.policyAllowed', 'This machine’s administrator allows only some exits'),
      hint: chooser.exitAllowed.length
        ? chooser.exitAllowed.join(', ')
        : t('deviceExit.policyAllowedNone', 'None is allowed'),
    }
  return null
}
