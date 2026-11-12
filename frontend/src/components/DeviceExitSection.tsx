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
import { graphQLSetDeviceRoute, keepProtectServed } from '../services/deviceProtect'
import { DeviceSetting } from '../services/graphQLDeviceSettings'
import { servingLine } from '../helpers/exitServingHelper'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { settingNote } from './DeviceSettingRow'
import { ListItemSetting } from './ListItemSetting'
import { Notice } from './Notice'
import { SelectSetting } from './SelectSetting'
import { TransferUsageHintText, useTransferUsageHint } from './TransferUsage'

/* remote.it Protect and the exit it routes through (graphql-api docs/PROXY-GROUPS.md §13, §15), apart, as the device's
   own app ("remote.it Protect", "Route through") and its menu show them: a Protect switch, and a Route through picker
   among the exits offered for the device (exits, with the device; never the one it runs), each named by why it is
   offered and its devices counted (Exit.serving, where the API counts them). The route is kept while Protect is off.
   Choosing a route leaves Protect as it is (setDeviceExit's keepProtect, where the API has it; an older one turns it on
   with the route, and says so); Protect cannot be turned on without a route. Underneath they are the device's `exit` and
   `protect` settings, the machine's: who set each — in the portal, on the machine by a signed-in person (ending at their
   sign-out), or by its administrator — and what its administrator holds (exit_control: the exit kept local, none
   allowed, one pinned; Protect's control) are said per control, as the menu says them. Only someone who manages the
   device changes them; anyone else sees them read-only, and why. With none of its exit's devices carrying its traffic
   the exit is dormant: its traffic goes its usual way, Protect off for it, until one does. Where the exit is not working
   on the device (Device.exitError: its routes could not be set there) Protect's line says so, in the device's words.
   remote.it's exits are the only ones charged. Device sessions only; nothing shows where the API lacks them. */
export const DeviceExitChoice: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const [info, setInfo] = useState<DeviceExit | null>()
  const [offered, setOffered] = useState<OfferedExit[]>([])
  const [protect, setProtect] = useState<ProtectInfo | null>(null)
  const [keepProtect, setKeepProtect] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const manage = device.permissions.includes('MANAGE')
  const settings = useDeviceSettings(device.id)
  const protectSetting = settings.setting('protect')

  const load = useCallback(async () => {
    const answer = await graphQLDeviceExit(device.id)
    setInfo(answer && typeof answer === 'object' ? answer : null)
    if (!answer || typeof answer !== 'object') return
    const [forDevice, kept, keeps] = await Promise.all([
      graphQLOfferedExits(device.id),
      graphQLDeviceProtect(device.id),
      keepProtectServed(),
    ])
    setOffered(Array.isArray(forDevice) ? forDevice : [])
    setProtect(kept && typeof kept === 'object' ? kept : null)
    setKeepProtect(keeps)
  }, [device.id])

  useEffect(() => {
    load()
  }, [load])

  const state = info ? protectState(info, protect, offered, manage) : null
  const charged = manage && (state?.exit?.remoteit || !!offered.find(each => each.id === state?.route)?.remoteit)
  // The device's own exit traffic is charged to its account, the owner's, not to whoever views it.
  const usage = useTransferUsageHint(device.owner?.id, 'exit', !!charged)

  if (!info || !state) return null
  const { on, exit, route, routeName, dormant } = state

  // The machine's administrator holds over the portal (device-package docs/menu-app.md §3), per control: the exit —
  // kept local, none allowed, one pinned — and Protect's own control. Protect is the exit's too: off is everyone's.
  const policy = policyLine(t, info)
  const routeLocked = info.exitPolicy === 'local' || info.exitPolicy === 'never' || !!info.exitPinned
  const protectHeld = protectLocked(protectSetting)
  const protectLockedNow =
    protectHeld || info.exitPolicy === 'local' || !!info.exitPinned || (info.exitPolicy === 'never' && !on)
  const failing = on ? exitErrorLine(t, info.exitError) : null

  // Why the switch cannot be turned on here, said under it: no route yet, or its route has no device available.
  const needsRoute = !on && !route
  const routeDormant = !on && !!route && dormant
  const why = !manage
    ? t('deviceExit.readOnlyBoth', 'Only someone who manages this device changes Protect and its route')
    : needsRoute
    ? t('deviceExit.chooseRouteFirst', 'Choose an exit under Route through to turn Protect on')
    : routeDormant
    ? t(
        'deviceExit.routeDormant',
        '{{exit}} has no device available: Protect can be turned on through it once one does',
        {
          exit: routeName,
        }
      )
    : undefined

  const run = async (change: () => Promise<any>) => {
    if (saving || !manage) return
    setSaving(true)
    const refused = refusalOf(await change())
    setRefusal(
      refused === undefined ? undefined : refused || t('deviceExit.notChosen', 'It was not changed: try again.')
    )
    await Promise.all([load(), settings.reload()])
    // The device list marks Protect on (DeviceName): read the device again for it.
    if (refused === undefined)
      dispatch.devices.fetchSingleFull({ id: device.id, accountId: device.accountId, silent: true })
    setSaving(false)
  }

  // On through the route kept; off keeps it.
  const toggle = () => run(() => graphQLSetDeviceExit(device.id, on ? null : route))
  // The route alone, Protect as it is; an API without keepProtect turns Protect on with it.
  const choose = (via: string) =>
    via &&
    via !== route &&
    run(() => (keepProtect ? graphQLSetDeviceRoute(device.id, via) : graphQLSetDeviceExit(device.id, via)))

  const choices: ISelect[] = offered.map(each => choiceOf(t, info, each))
  if (route && !offered.some(each => each.id === route))
    choices.push({
      key: route,
      name: dormant ? t('deviceExit.choiceDormant', '{{exit}} · no device available', { exit: routeName }) : routeName!,
      description: (!dormant && exit && servingLine(t, exit.serving)) || undefined,
    })
  if (!route)
    choices.unshift({
      key: '',
      name: offered.length
        ? t('deviceExit.chooseRoute', 'Choose an exit')
        : t('deviceExit.noExits', 'No exits for this device'),
      disabled: true,
    })

  const status = statusLine(t, state, info.usesExitThrough?.name, failing)
  const protectLines = [
    failing?.words,
    settingNote(t, protectSetting),
    protectHeld ? undefined : protectPolicyLine(t, info),
    why,
  ].filter(Boolean) as string[]

  const routeLines = [
    route ? chosenLine(t, info) : null,
    lentLine(t, info),
    manage && !routeLocked && !protectLockedNow && route && !on && !dormant
      ? t('deviceExit.turnOnHint', 'Turn Protect on to send traffic through it')
      : null,
    manage && !routeLocked && !on && !keepProtect && offered.length
      ? t('deviceExit.choosingTurnsOn', 'Choosing an exit turns Protect on')
      : null,
  ].filter(Boolean) as string[]

  return (
    <>
      <ListItemSetting
        icon="shield"
        iconColor={failing ? failing.color : on && !dormant ? 'primary' : undefined}
        label={t('deviceExit.protect', 'remote.it Protect')}
        subLabel={
          <>
            <Box
              component="span"
              data-protect-status
              sx={failing ? { color: `${failing.color === 'danger' ? 'error' : 'warning'}.main` } : undefined}
            >
              {status}
            </Box>
            {protectLines.map(line => (
              <Box component="span" display="block" key={line}>
                {line}
              </Box>
            ))}
          </>
        }
        toggle={on}
        disabled={!manage || saving || protectLockedNow || (!on && (!route || dormant))}
        onClick={toggle}
      />
      <SelectSetting
        icon="arrow-right-from-bracket"
        label={t('deviceExit.route', 'Route through')}
        value={route ?? ''}
        values={choices}
        disabled={!manage || saving || routeLocked}
        helpMessage={t(
          'deviceExit.routeHint',
          'The exit Protect sends all of this device’s traffic through, kept while Protect is off. While it cannot be reached, traffic stops rather than going its usual way.'
        )}
        helperText={
          routeLines.length ? (
            <>
              {routeLines.map(line => (
                <Box component="span" display="block" key={line}>
                  {line}
                </Box>
              ))}
            </>
          ) : undefined
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

// Protect's line, as the menu says its state: protecting through the exit (and the device of it in use), on but held —
// its exit dormant, or none of its devices taking its traffic —, off, or not working on the device (exitErrorLine).
export function statusLine(
  t: T,
  state: ProtectState,
  through: string | undefined,
  failing: ReturnType<typeof exitErrorLine>
): string {
  const exit = state.routeName
  if (failing) return failing.label
  if (!state.on) return t('deviceExit.statusOff', 'Off — traffic goes its usual way')
  if (state.dormant)
    return t(
      'deviceExit.statusDormant',
      'On — {{exit}} has no device available, so traffic goes its usual way until one does',
      { exit }
    )
  if (!state.offered)
    return t(
      'deviceExit.statusWaiting',
      'On — none of {{exit}}’s devices takes its traffic now: it stops until one does',
      {
        exit,
      }
    )
  if (through)
    return t('deviceExit.statusThrough', 'Protecting — going out through {{exit}} (device {{device}})', {
      exit,
      device: through,
    })
  return t('deviceExit.statusOn', 'Protecting — going out through {{exit}}', { exit })
}

// Protect held by the machine's administrator (its control: kept local, or held on or off): read-only here.
export const protectLocked = (setting?: DeviceSetting) =>
  setting?.control === 'local' || setting?.control === 'on' || setting?.control === 'off'

// Why Protect is not the portal's to change where its own control does not say: the exit's policy — kept local, or
// pinned — holds Protect too (the menu's "Set by this machine's administrator").
export function protectPolicyLine(t: T, info: DeviceExit): string | undefined {
  if (info.exitPolicy === 'local')
    return t('deviceExit.protectPolicyLocal', 'Set only on the device: its administrator keeps its exit local')
  if (info.exitPinned) return t('deviceExit.protectPinned', 'Set by this machine’s administrator')
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
      label: t(
        'deviceExit.errorHeld',
        'Not working on this device: the exit’s routes could not be set — traffic is blocked'
      ),
      words,
      color: 'warning',
    }
  if (error.code === 'routes-failed')
    return {
      label: t(
        'deviceExit.errorFailed',
        'Not working on this device: the exit’s routes could not be set — traffic goes out directly'
      ),
      words,
      color: 'danger',
    }
  return {
    label: t('deviceExit.error', 'Not working on this device'),
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
      : t('deviceExit.notAllowed', 'Not allowed by this machine’s administrator'),
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
