import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ListItem, ListItemIcon } from '@mui/material'
import { refusalOf } from '../services/graphQL'
import {
  DeviceExit,
  OfferedExit,
  ProtectInfo,
  graphQLDeviceExit,
  graphQLDeviceProtect,
  graphQLOfferedExits,
  graphQLSetDeviceExit,
} from '../services/graphQLExits'
import { ListItemSetting } from './ListItemSetting'
import { Notice } from './Notice'
import { SelectSetting } from './SelectSetting'
import { TransferUsageHintText, useTransferUsageHint } from './TransferUsage'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { productLockNote } from '../helpers/productPolicyHelper'

/* The exit a device's traffic goes out through (graphql-api docs/PROXY-GROUPS.md §13): Device.usesExit — apart from the
   exit it runs (its Runs) —, chosen here among the exits offered for it (exits, with the device; never the one it runs),
   each named by why it is offered: remote.it's by plan, its account's own, those shared with the person choosing or
   reached by their role, and those its networks make available to it. With none of its devices carrying its traffic the
   exit is dormant — no device available —: its traffic goes its usual way, Protect off for it, until one does, and the
   choice is kept. Who chose it, and what the machine's
   administrator decided of it there, are said; their policy holds over the portal. remote.it's exits are the only ones
   charged. Device sessions only; nothing shows where the API lacks them. */
export const DeviceExitChoice: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const [info, setInfo] = useState<DeviceExit | null>()
  const [offered, setOffered] = useState<OfferedExit[]>([])
  const [protect, setProtect] = useState<ProtectInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const manage = device.permissions.includes('MANAGE')
  // An exit its product sets, under synced or enforced, is the product's to change.
  const productLock = useDeviceSettings(device.id).setting('exit')?.locked

  const load = useCallback(async () => {
    const answer = await graphQLDeviceExit(device.id)
    setInfo(answer && typeof answer === 'object' ? answer : null)
    if (!answer || typeof answer !== 'object') return
    const [forDevice, kept] = await Promise.all([graphQLOfferedExits(device.id), graphQLDeviceProtect(device.id)])
    setOffered(Array.isArray(forDevice) ? forDevice : [])
    setProtect(kept && typeof kept === 'object' ? kept : null)
  }, [device.id])

  useEffect(() => {
    load()
  }, [load])

  const exit = info?.usesExit
  // Protect off on the device, with the exit it would route through: said, and turned on through it by choosing that
  // exit here — the device takes the newer choice, as it takes any. Not while its exit is dormant: Protect is off for it
  // until a device of the exit is in service.
  const route = info && !exit && !info.exitDormant && protect?.on === false && protect.route ? protect.route : null
  // Protect off, its exit kept and dormant: nothing to turn on through yet, but the exit kept is said.
  const keptDormant = info && !exit && info.exitDormant && protect?.on === false && protect.route ? protect.route : null
  const charged = manage && (exit?.remoteit || !!offered.find(each => each.id === route)?.remoteit)
  // The device's own exit traffic is charged to its account, the owner's, not to whoever views it.
  const usage = useTransferUsageHint(device.owner?.id, 'exit', !!charged)

  if (!info) return null

  const choices = [
    { key: '', name: t('deviceExit.none', 'None — its usual way out') },
    ...offered.map(each => ({ key: each.id, name: choiceName(t, each) })),
  ]
  if (exit && !offered.some(each => each.id === exit.id))
    choices.push({
      key: exit.id,
      name: info.exitDormant
        ? t('deviceExit.choiceDormant', '{{exit}} · no device available', { exit: exit.name })
        : exit.name,
    })

  // The machine's administrator's policy holds over the portal: under local or never, nothing is chosen here. Nor where
  // its product holds it.
  const policy = info.exitPolicy
  const locked = policy === 'local' || policy === 'never' || !!productLock
  const chosenBy = exit ? chosenLine(t, info) : null
  const policyText = policyLine(t, info)
  const routeName = route ? protect?.routeName || offered.find(each => each.id === route)?.name || route : null
  const keptName = keptDormant ? protect?.routeName || keptDormant : null

  const choose = async (via: string | null) => {
    if (saving) return
    setSaving(true)
    const refused = refusalOf(await graphQLSetDeviceExit(device.id, via))
    setRefusal(refused === undefined ? undefined : refused || t('deviceExit.notChosen', 'It was not changed: try again.'))
    await load()
    setSaving(false)
  }

  return (
    <>
      {manage && (
        <SelectSetting
          icon="arrow-right-from-bracket"
          label={t('deviceExit.via', 'Send its traffic out through')}
          value={exit?.id ?? ''}
          values={choices}
          disabled={saving || locked}
          helpMessage={
            productLock
              ? productLockNote(t, productLock)
              : t(
                  'deviceExit.viaHint',
                  'All of this device’s traffic leaves through the exit — and stops, rather than going its usual way, while the exit cannot be reached.'
                )
          }
          onChange={via => choose(via || null)}
        />
      )}
      {refusal && (
        <ListItem dense>
          <Notice severity="error" fullWidth onClose={() => setRefusal(undefined)}>
            {refusal}
          </Notice>
        </ListItem>
      )}
      {usage && (
        <ListItem dense>
          <ListItemIcon />
          <TransferUsageHintText hint={usage} />
        </ListItem>
      )}
      {route && (
        <ListItemSetting
          icon="shield-alt"
          label={t('deviceExit.protectOff', 'Protect: off — route {{name}}', { name: routeName })}
          subLabel={t(
            'deviceExit.protectOffHint',
            'Turned off on the device, which keeps {{name}} to route through when Protect is on again',
            { name: routeName }
          )}
          button={manage && !locked ? t('deviceExit.protectOn', 'Turn on') : undefined}
          disabled={saving}
          onButtonClick={() => choose(route)}
        />
      )}
      {keptName && (
        <ListItemSetting
          icon="moon"
          iconColor="grayDarker"
          label={t('deviceExit.keptDormant', 'Protect: off — its exit, {{exit}}, is kept, with no device available', {
            exit: keptName,
          })}
          subLabel={t(
            'deviceExit.keptDormantHint',
            'None of the exit’s devices carries its traffic: Protect can be turned on through it once one does. Or choose another exit.'
          )}
        />
      )}
      {exit && info.exitDormant && (
        <ListItemSetting
          icon="moon"
          iconColor="grayDarker"
          label={t('deviceExit.dormant', 'Its exit, {{exit}}, is dormant', { exit: exit.name })}
          subLabel={t(
            'deviceExit.dormantHint',
            'No device available: none of the exit’s devices carries its traffic, so its traffic goes its usual way, Protect off for it, until one does — then it goes out through the exit again by itself. Or choose another exit.'
          )}
        />
      )}
      {exit && !info.exitDormant && !exit.offered && (
        <ListItemSetting
          icon="triangle-exclamation"
          iconColor="warning"
          label={t('deviceExit.waiting', 'None of {{exit}}’s devices takes its traffic now', { exit: exit.name })}
          subLabel={t(
            'deviceExit.waitingHint',
            'Its traffic stops until one does: a device added to the exit, or one of its devices offering itself again. Or choose another exit.'
          )}
        />
      )}
      {exit && !info.exitDormant && exit.offered && info.usesExitThrough && (
        <ListItemSetting
          icon="route"
          label={t('deviceExit.through', 'Going out through {{device}} now', { device: info.usesExitThrough.name })}
          subLabel={t('deviceExit.throughHint', 'remote.it picks the device of the exit its new connections go through')}
        />
      )}
      {chosenBy && <ListItemSetting icon="user" label={chosenBy} />}
      {policyText && <ListItemSetting icon="lock" label={policyText.label} subLabel={policyText.hint} />}
    </>
  )
}

type T = TFunction

// An exit offered for the device, named by why it is offered: remote.it's and your own by name; one shared with you or
// reached by your role by whose it is; one its networks alone give it, so. With no reasons said, by whose it is.
export function choiceName(t: T, exit: Pick<OfferedExit, 'name' | 'remoteit' | 'owner' | 'reasons'>): string {
  const reasons = exit.reasons ?? []
  const whose = exit.owner?.email
    ? t('deviceExit.whose', '{{exit}} · {{email}}’s', { exit: exit.name, email: exit.owner.email })
    : exit.name
  if (exit.remoteit || reasons.includes('OWN') || reasons.includes('PLAN')) return exit.name
  if (reasons.includes('SHARED') || reasons.includes('ROLE')) return whose
  if (reasons.includes('NETWORK')) return t('deviceExit.byNetwork', '{{exit}} · by its network', { exit: exit.name })
  return whose
}

// Who chose the exit in force: someone on the device (its OS user, when the device said), or a person in the portal.
export function chosenLine(t: T, chooser: DeviceExit | null): string | null {
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
export function policyLine(t: T, chooser: DeviceExit | null): { label: string; hint?: string } | null {
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
