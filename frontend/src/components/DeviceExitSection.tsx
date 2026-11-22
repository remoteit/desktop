import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, ListItem, ListItemIcon } from '@mui/material'
import { dispatch } from '../store'
import { refusalOf } from '../services/graphQL'
import {
  DeviceExit,
  DeviceExitError,
  OfferedExit,
  ProtectInfo,
  graphQLDeviceExit,
  graphQLDeviceProtect,
  graphQLOfferedExits,
  graphQLSetDeviceExit,
} from '../services/graphQLExits'
import { DeviceSetting } from '../services/graphQLDeviceSettings'
import { servingLine } from '../helpers/exitServingHelper'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { settingNote } from './DeviceSettingRow'
import { ListItemSetting } from './ListItemSetting'
import { Notice } from './Notice'
import { SelectSetting } from './SelectSetting'
import { TransferUsageHintText, useTransferUsageHint } from './TransferUsage'

/* Route through (graphql-api docs/PROXY-GROUPS.md §13, §15), one control as the device's own app and its menu show it:
   Off, or one of the exits offered for the device (exits, with the device; never the one it runs), each named by why it
   is offered and its devices counted (Exit.serving, where the API counts them). Choosing an exit routes all of the
   device's traffic through it (setDeviceExit(via)); Off stops (setDeviceExit(none)), the exit kept by the device for
   next time. Underneath they are the device's `exit` and `protect` settings, the machine's: who set them — in Remote.It,
   on the machine by a signed-in person (ending at their sign-out), or by its administrator — and what its administrator
   holds (exit_control: the exit kept local, none allowed, one pinned; the protect setting's control) are said under
   it, as the menu says them. Only someone who manages the device changes it; anyone else sees it read-only, and why.
   With none of its exit's devices carrying its traffic the exit is dormant: traffic goes its usual way until one does.
   Where the exit is not working on the device (Device.exitError: its routes could not be set there) the line says so,
   in the device's words. Remote.It's exits are the only ones charged. Device sessions only; nothing shows where the API
   lacks them. */
export const DeviceExitChoice: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const [info, setInfo] = useState<DeviceExit | null>()
  const [offered, setOffered] = useState<OfferedExit[]>([])
  const [protect, setProtect] = useState<ProtectInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const manage = device.permissions.includes('MANAGE')
  const settings = useDeviceSettings(device.id)
  const protectSetting = settings.setting('protect')

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

  const state = info ? protectState(info, protect, offered, manage) : null
  const charged = manage && (state?.exit?.remoteit || !!offered.find(each => each.id === state?.route)?.remoteit)
  // The device's own exit traffic is charged to its account, the owner's, not to whoever views it.
  const usage = useTransferUsageHint(device.owner?.id, 'exit', !!charged && !!state?.on)

  if (!info || !state) return null
  const { on, route, routeName } = state

  // The machine's administrator holds over Remote.It (device-package docs/menu-app.md §3): the exit kept local or
  // pinned, the protect setting's own control — read-only here. With no exit allowed, Off is still everyone's.
  const policy = policyLine(t, info)
  const held =
    protectLocked(protectSetting) || info.exitPolicy === 'local' || !!info.exitPinned || (info.exitPolicy === 'never' && !on)
  const onlyOff = info.exitPolicy === 'never'
  const failing = on ? exitErrorLine(t, info.exitError) : null

  const run = async (change: () => Promise<any>) => {
    if (saving || !manage) return
    setSaving(true)
    const refused = refusalOf(await change())
    setRefusal(
      refused === undefined
        ? undefined
        : refused || t('deviceExit.notChosen', 'Couldn’t change Route through. Try again.')
    )
    await Promise.all([load(), settings.reload()])
    // The device list marks a device routed through an exit (DeviceName): read the device again for it.
    if (refused === undefined)
      dispatch.devices.fetchSingleFull({ id: device.id, accountId: device.accountId, silent: true })
    setSaving(false)
  }

  const current = on ? route ?? '' : ''
  const choose = (via: string) => {
    if (via === current) return
    run(() => graphQLSetDeviceExit(device.id, via || null))
  }

  const choices: ISelect[] = [
    { key: '', name: t('deviceExit.off', 'Off') },
    ...offered.map(each => {
      const choice = choiceOf(t, info, each)
      return onlyOff ? { ...choice, disabled: true } : choice
    }),
  ]
  if (route && !offered.some(each => each.id === route))
    choices.push({
      key: route,
      name: state.dormant ? t('deviceExit.choiceDormant', '{{exit}} · no device available', { exit: routeName }) : routeName!,
      description: (!state.dormant && state.exit && servingLine(t, state.exit.serving)) || undefined,
      disabled: onlyOff,
    })

  const lines = [
    statusLine(t, state, info.usesExitThrough?.name, failing),
    failing?.words,
    !manage ? t('deviceExit.readOnly', 'Only someone who manages this device can change Route through.') : null,
    !offered.length && !route ? t('deviceExit.noExits', 'No exits for this device yet.') : null,
    on ? chosenLine(t, info) : null,
    lentLine(t, info),
    settingNote(t, protectSetting),
    protectLocked(protectSetting) ? undefined : protectPolicyLine(t, info),
  ].filter(Boolean) as string[]

  return (
    <>
      <SelectSetting
        icon="route"
        label={t('deviceExit.route', 'Route through')}
        value={current}
        values={choices}
        disabled={!manage || saving || held}
        helpMessage={t(
          'deviceExit.routeHint',
          'Sends all of this device’s internet traffic through the exit you choose. If the exit can’t be reached, traffic stops.'
        )}
        helperText={
          <>
            {lines.map((line, index) => (
              <Box
                component="span"
                display="block"
                key={line}
                data-route-status={index === 0 ? '' : undefined}
                sx={index === 0 && failing ? { color: `${failing.color === 'danger' ? 'error' : 'warning'}.main` } : undefined}
              >
                {line}
              </Box>
            ))}
          </>
        }
        onChange={choose}
      />
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
      {policy && <ListItemSetting icon="lock" label={policy.label} subLabel={policy.hint} />}
    </>
  )
}

// Protect and its route as the section shows them. On: graphql's exit in use (Device.usesExit, while Protect is on) —
// read only by someone who manages the device, so anyone else is shown the device's own word (about.protect). The
// route: the exit in use, else the one kept while off (about.protect.route), named by the device, the exits offered, or
// its id. Dormant: the device's exit has no device carrying its traffic.
export type ProtectState = {
  on: boolean
  exit: DeviceExit['usesExit']
  route: string | null
  routeName: string | null
  dormant: boolean
  offered: boolean // the exit in use is taken by one of its devices now
}

export function protectState(
  info: DeviceExit,
  protect: ProtectInfo | null,
  offered: Pick<OfferedExit, 'id' | 'name'>[],
  manage: boolean
): ProtectState {
  const exit = info.usesExit
  const on = !!exit || (!manage && protect?.on === true)
  const route = exit?.id ?? protect?.route ?? null
  const routeName = exit?.name ?? (protect?.routeName || offered.find(each => each.id === route)?.name || route)
  return { on, exit, route, routeName, dormant: !!info.exitDormant, offered: exit ? exit.offered !== false : true }
}

// Route through's state, as the menu says it: off; on through the exit (and the device of it in use); on but waiting —
// its exit dormant, or none of its devices taking its traffic; or not working on the device (exitErrorLine).
export function statusLine(
  t: T,
  state: ProtectState,
  through: string | undefined,
  failing: ReturnType<typeof exitErrorLine>
): string {
  const exit = state.routeName
  if (failing) return failing.label
  if (!state.on) return t('deviceExit.statusOff', 'Off. Traffic goes out directly.')
  if (state.dormant)
    return t('deviceExit.statusDormant', 'Waiting for exit. {{exit}} has no device available, so traffic goes out directly.', {
      exit,
    })
  if (!state.offered)
    return t('deviceExit.statusWaiting', 'Waiting for exit. Traffic is blocked until a device of {{exit}} takes it.', {
      exit,
    })
  if (through)
    return t('deviceExit.statusThrough', 'All traffic goes through {{exit}} (device {{device}}).', {
      exit,
      device: through,
    })
  return t('deviceExit.statusOn', 'All traffic goes through {{exit}}.', { exit })
}

// The protect setting held by the machine's administrator (its control: kept local, or held on or off): read-only here.
export const protectLocked = (setting?: DeviceSetting) =>
  setting?.control === 'local' || setting?.control === 'on' || setting?.control === 'off'

// Why Route through is not Remote.It's to change where the protect setting's control does not say: the exit's policy —
// kept local, or pinned (the menu's "Set by this machine's administrator").
export function protectPolicyLine(t: T, info: DeviceExit): string | undefined {
  if (info.exitPolicy === 'local')
    return t('deviceExit.protectPolicyLocal', 'Set on the device only. Its administrator keeps the exit local.')
  if (info.exitPinned) return t('deviceExit.protectPinned', 'Set by this device’s administrator')
  return undefined
}

type T = TFunction

// The exit not working on the device, by its report: its routes could not be set — its traffic going out directly
// (routes-failed: not protected, the danger colour) or held by the kill switch (routes-held: blocked, a warning) —, as
// connectd's menu says it ("Exit's routes not set — traffic goes out directly"), with the device's own words under it.
// A code from a newer daemon is said as not working, in its words. None while it works.
export function exitErrorLine(
  t: T,
  error: DeviceExitError | null | undefined
): { label: string; words: string | undefined; color: 'danger' | 'warning' } | null {
  if (!error) return null
  const words = error.message && error.message !== error.code ? error.message : undefined
  if (error.code === 'routes-held')
    return {
      label: t('deviceExit.errorHeld', 'Exit not working on this device. Traffic is blocked.'),
      words,
      color: 'warning',
    }
  if (error.code === 'routes-failed')
    return {
      label: t('deviceExit.errorFailed', 'Exit not working on this device. Traffic goes out directly.'),
      words,
      color: 'danger',
    }
  return {
    label: t('deviceExit.error', 'Exit not working on this device'),
    words: error.message || error.code,
    color: 'danger',
  }
}

// An exit offered, as the list shows it: named by why it is offered, its devices counted under it, and — where the
// machine's administrator allows only some exits — one not among them there, not chosen (graphql would refuse it).
export function choiceOf(t: T, chooser: Pick<DeviceExit, 'exitAllowed'> | null, exit: OfferedExit): ISelect {
  const allowed = !chooser?.exitAllowed || chooser.exitAllowed.includes(exit.id)
  return {
    key: exit.id,
    name: choiceName(t, exit),
    description: allowed
      ? servingLine(t, exit.serving) ?? undefined
      : t('deviceExit.notAllowed', 'Not allowed by this device’s administrator'),
    disabled: !allowed,
  }
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
  if (reasons.includes('NETWORK')) return t('deviceExit.byNetwork', '{{exit}} · chosen by a network', { exit: exit.name })
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
      return t('deviceExit.setOnComputerBy', 'Set on the device by {{name}}, until {{name}} signs out', {
        name,
      })
    if (chooser.exitSetOnDeviceBy)
      return t('deviceExit.setOnDeviceBy', 'Set on the device by {{name}}', { name: chooser.exitSetOnDeviceBy })
    return chooser.exitSetOnDeviceAdmin
      ? t('deviceExit.setOnDeviceAdmin', 'Set on the device by its administrator')
      : t('deviceExit.setOnDevice', 'Set on the device')
  }
  if (chooser.exitSetBy?.email)
    return t('deviceExit.setInPortalBy', 'Set in Remote.It by {{name}}', { name: chooser.exitSetBy.email })
  return null
}

// An exit the device could not use as itself, gone through on a person's own access to it: lent to the whole machine,
// every account's traffic through it.
export function lentLine(t: T, chooser: DeviceExit | null): string | null {
  const exit = chooser?.usesExit
  const person = chooser?.exitThroughPerson
  if (!exit || !person) return null
  return t('deviceExit.lent', 'The whole device goes through {{exit}}, {{name}}’s exit', {
    name: person.email || person.id,
    exit: exit.name,
  })
}

// What the machine's administrator decided of its exit on the device, if anything.
export function policyLine(t: T, chooser: DeviceExit | null): { label: string; hint?: string } | null {
  if (!chooser) return null
  if (chooser.exitPolicy === 'never')
    return {
      label: t('deviceExit.policyNever', 'This device’s administrator allows no exit'),
      hint: t('deviceExit.policyHint', 'Set on the device: sudo remoteit-device policy'),
    }
  if (chooser.exitPolicy === 'local')
    return {
      label: t('deviceExit.policyLocal', 'This device’s administrator keeps the exit local'),
      hint: t('deviceExit.policyLocalHint', 'The exit is chosen on the device only. Remote.It can’t change it.'),
    }
  if (chooser.exitPinned)
    return {
      label: t('deviceExit.policyPinned', 'Fixed by this device’s administrator to {{id}}', {
        id: chooser.exitPinned,
      }),
      hint: t('deviceExit.policyPinnedHint', 'The fixed exit holds over any chosen here.'),
    }
  if (chooser.exitAllowed)
    return {
      label: t('deviceExit.policyAllowed', 'This device’s administrator allows only some exits'),
      hint: chooser.exitAllowed.length
        ? chooser.exitAllowed.join(', ')
        : t('deviceExit.policyAllowedNone', 'None is allowed'),
    }
  return null
}
