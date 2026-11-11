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
import { servingLine } from '../helpers/exitServingHelper'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { settingNote } from './DeviceSettingRow'
import { ListItemSetting } from './ListItemSetting'
import { Notice } from './Notice'
import { SelectSetting } from './SelectSetting'
import { TransferUsageHintText, useTransferUsageHint } from './TransferUsage'

/* The exit a device's traffic goes out through (graphql-api docs/PROXY-GROUPS.md §13): Device.usesExit — apart from the
   exit it runs (its Runs) —, chosen here among the exits offered for it (exits, with the device; never the one it runs),
   each named by why it is offered: remote.it's by plan, its account's own, those shared with the person choosing or
   reached by their role, and those its networks make available to it. With none of its devices carrying its traffic the
   exit is dormant — no device available —: its traffic goes its usual way, Protect off for it, until one does, and the
   choice is kept. Who chose it, and what the machine's
   administrator decided of it there, are said; their policy holds over the portal. The exit and Protect are the
   machine's (§15): one chosen there by a signed-in person ends at their sign-out, and may be their own exit, lent to the
   whole machine. remote.it's exits are the only ones charged. Device sessions only; nothing shows where the API lacks
   them.
   An exit is run by one device or several, and remote.it picks the one its new connections go through: each exit is
   offered with its devices counted (Exit.serving, where the API counts them), and the device of it in use is said with
   them. Only someone who manages the device chooses; anyone else sees the choice, read-only. The administrator's
   policy shows in the list too: an exit it does not allow is there, and not chosen. */
export const DeviceExitChoice: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const [info, setInfo] = useState<DeviceExit | null>()
  const [offered, setOffered] = useState<OfferedExit[]>([])
  const [protect, setProtect] = useState<ProtectInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const manage = device.permissions.includes('MANAGE')
  const protectSetting = useDeviceSettings(device.id).setting('protect')

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

  const choices: ISelect[] = [
    { key: '', name: t('deviceExit.none', 'None — its usual way out') },
    ...offered.map(each => choiceOf(t, info, each)),
  ]
  if (exit && !offered.some(each => each.id === exit.id))
    choices.push({
      key: exit.id,
      name: info.exitDormant
        ? t('deviceExit.choiceDormant', '{{exit}} · no device available', { exit: exit.name })
        : exit.name,
      description: (!info.exitDormant && servingLine(t, exit.serving)) || undefined,
    })

  // The machine's administrator's policy holds over the portal: under local or never, nothing is chosen here.
  const policy = info.exitPolicy
  const locked = policy === 'local' || policy === 'never'
  const chosenBy = exit ? chosenLine(t, info) : null
  const lent = exit ? lentLine(t, info) : null
  const policyText = policyLine(t, info)
  const routeName = route ? protect?.routeName || offered.find(each => each.id === route)?.name || route : null
  // Who turned Protect off, where the setting says: on this computer by someone signed in, ending at their sign-out.
  const protectNote = route ? settingNote(t, protectSetting) : undefined
  const keptName = keptDormant ? protect?.routeName || keptDormant : null

  const choose = async (via: string | null) => {
    if (saving) return
    setSaving(true)
    const refused = refusalOf(await graphQLSetDeviceExit(device.id, via))
    setRefusal(
      refused === undefined ? undefined : refused || t('deviceExit.notChosen', 'It was not changed: try again.')
    )
    await load()
    setSaving(false)
  }

  return (
    <>
      {!manage && (
        <ListItemSetting
          icon="arrow-right-from-bracket"
          label={
            exit
              ? t('deviceExit.readOnly', 'Sends its traffic out through {{exit}}', { exit: exit.name })
              : t('deviceExit.readOnlyNone', 'No exit — its traffic goes its usual way')
          }
          subLabel={t('deviceExit.readOnlyHint', 'Only someone who manages this device chooses its exit')}
        />
      )}
      {manage && (
        <SelectSetting
          icon="arrow-right-from-bracket"
          label={t('deviceExit.via', 'Send its traffic out through')}
          value={exit?.id ?? ''}
          values={choices}
          disabled={saving || locked}
          helpMessage={t(
            'deviceExit.viaHint',
            'All of this device’s traffic leaves through the exit — and stops, rather than going its usual way, while the exit cannot be reached.'
          )}
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
          subLabel={
            protectNote
              ? `${protectNote}. ${t(
                  'deviceExit.protectOffKeeps',
                  'It keeps {{name}} to route through when Protect is on again',
                  { name: routeName }
                )}`
              : t(
                  'deviceExit.protectOffHint',
                  'Turned off on the device, which keeps {{name}} to route through when Protect is on again',
                  { name: routeName }
                )
          }
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
          subLabel={throughLine(t, exit.name, exit.serving)}
        />
      )}
      {chosenBy && <ListItemSetting icon="user" label={chosenBy} subLabel={lent} />}
      {policyText && <ListItemSetting icon="lock" label={policyText.label} subLabel={policyText.hint} />}
    </>
  )
}

type T = TFunction

// An exit offered, as the list shows it: named by why it is offered, its devices counted under it, and — where the
// machine's administrator allows only some exits — one not among them there, not chosen (graphql would refuse it).
export function choiceOf(t: T, chooser: Pick<DeviceExit, 'exitAllowed'> | null, exit: OfferedExit): ISelect {
  const allowed = !chooser?.exitAllowed || chooser.exitAllowed.includes(exit.id)
  return {
    key: exit.id,
    name: choiceName(t, exit),
    description: allowed
      ? servingLine(t, exit.serving) ?? undefined
      : t('deviceExit.notAllowed', 'Not allowed by this machine’s administrator'),
    disabled: !allowed,
  }
}

// Under the device of the exit in use: the exit's devices counted, where the API counts them, and that remote.it picks.
export function throughLine(t: T, exit: string, serving?: OfferedExit['serving']): string {
  const picks = t('deviceExit.throughHint', 'remote.it picks the device of the exit its new connections go through')
  const counted = servingLine(t, serving)
  return counted ? `${t('deviceExit.throughOf', '{{exit}}: {{counted}}', { exit, counted })}. ${picks}` : picks
}

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

// Who chose the exit in force: a person signed in on the device, whose choice ends at their sign-out; someone else on
// it — its administrator, or a daemon from before sign-ins per account — by their OS user, when the device said; or a
// person in the portal.
export function chosenLine(t: T, chooser: DeviceExit | null): string | null {
  if (!chooser) return null
  if (chooser.exitSetOnDevice) {
    const signedIn = chooser.exitSetOnDeviceSignedIn
    const name = signedIn?.email || signedIn?.id
    if (name)
      return t('deviceExit.setOnComputerBy', 'Set on this computer by {{name}} — ends when {{name}} signs out', {
        name,
      })
    if (chooser.exitSetOnDeviceBy)
      return t('deviceExit.setOnDeviceBy', 'Set on the device by {{name}}', { name: chooser.exitSetOnDeviceBy })
    return chooser.exitSetOnDeviceAdmin
      ? t('deviceExit.setOnDeviceAdmin', 'Set on the device by its administrator')
      : t('deviceExit.setOnDevice', 'Set on the device')
  }
  if (chooser.exitSetBy?.email)
    return t('deviceExit.setInPortalBy', 'Set in the portal by {{name}}', { name: chooser.exitSetBy.email })
  return null
}

// An exit the device could not use as itself, gone through on a person's own access to it: lent to the whole machine,
// every account's traffic through it.
export function lentLine(t: T, chooser: DeviceExit | null): string | null {
  const exit = chooser?.usesExit
  const person = chooser?.exitThroughPerson
  if (!exit || !person) return null
  return t('deviceExit.lent', 'Machine-wide through {{name}}’s exit {{exit}}', {
    name: person.email || person.id,
    exit: exit.name,
  })
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
