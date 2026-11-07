import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ListItem, ListItemIcon } from '@mui/material'
import {
  ExitChooser,
  ExitInfo,
  ProtectInfo,
  graphQLDeviceExit,
  graphQLDeviceExitChooser,
  graphQLDeviceProtect,
  graphQLExits,
  graphQLProxyPublicExit,
  graphQLSetDeviceExit,
} from '../services/graphQLProxy'
import { settingOn } from '../services/graphQLDeviceSettings'
import {
  ProxyGroup,
  graphQLDeleteProxyGroup,
  graphQLDeviceExitGroup,
  graphQLDeviceGroup,
  graphQLDeviceNetworkExitGroups,
  graphQLLeaveProxyGroup,
  graphQLSharedProxyGroups,
  refusalOf,
} from '../services/graphQLProxyGroups'
import { exitOffLine, groupOrNone, lastInGroup, sharedChoiceName } from '../helpers/proxyGroupHelper'
import type { DeviceSettings } from '../hooks/useDeviceSettings'
import { DeviceSettingRow } from './DeviceSettingRow'
import { LastInGroupDialog } from './LastInGroupDialog'
import { ListItemSetting } from './ListItemSetting'
import { Notice } from './Notice'
import { SelectSetting } from './SelectSetting'
import { TransferUsageHintText, useTransferUsageHint } from './TransferUsage'

/* A device and exit nodes (presence-server docs/proxy-plan.md §8): the exit its traffic goes out through — one you may
   use, chosen on Configure (DeviceExitChoice) — and whether it offers itself as one, on Proxy & exit
   (DeviceExitOffer): a device setting (exit_node) switched by whoever manages it, where the API has device settings;
   else what its own configuration says. Every exit is in a group (graphql-api docs/PROXY-GROUPS.md §11): an exit chosen
   as a group with no device taking its traffic now is said so — dormant when no device in the group is in service, its
   traffic going its usual way until one is —, the groups shared with the person choosing and those the device's
   networks make available are among the exits while offered, and turning off the last exit in a group asks whether to
   delete the group too (components/LastInGroupDialog.tsx). Device sessions only; nothing shows where the API lacks
   them. */

// The device's exit and, for the choice, who chose it, the exits it may use — the groups shared with the person
// choosing among them, and those its networks make available to it, while offered —, its Protect (the route kept while
// off), the group it goes through and whether that is dormant, and whether the exit or route is one of remote.it's public
// exits, the only ones charged: read again after each change.
function useDeviceExit(deviceId: string, choice: boolean) {
  const [info, setInfo] = useState<ExitInfo | null>()
  const [chooser, setChooser] = useState<ExitChooser | null>(null)
  const [exits, setExits] = useState<{ id: string; name: string }[]>([])
  const [shared, setShared] = useState<ProxyGroup[]>([])
  const [given, setGiven] = useState<{ id: string; name: string }[]>([])
  const [protect, setProtect] = useState<ProtectInfo | null>(null)
  const [publicExit, setPublicExit] = useState(false)
  const [group, setGroup] = useState<ProxyGroup | null>()
  const [through, setThrough] = useState<{ label: string; name: string; dormant: boolean } | null>(null)

  const load = useCallback(async () => {
    const answer = await graphQLDeviceExit(deviceId)
    setInfo(answer && typeof answer === 'object' ? answer : null)
    if (!choice) {
      // The group it is in, as an exit: whether it is the last device in it.
      setGroup(answer && typeof answer === 'object' ? groupOrNone(await graphQLDeviceGroup(deviceId)) : undefined)
      return
    }
    const who = await graphQLDeviceExitChooser(deviceId)
    setChooser(who && typeof who === 'object' ? who : null)
    const list = await graphQLExits()
    if (Array.isArray(list)) setExits(list.filter(e => e.id !== deviceId))
    const theirs = await graphQLSharedProxyGroups()
    const offered = Array.isArray(theirs) ? theirs.filter(g => g.offered) : []
    setShared(offered)
    // The groups its networks make available, which the device may use as itself though the person choosing may not.
    const networks = await graphQLDeviceNetworkExitGroups(deviceId)
    setGiven(networks)
    const kept = await graphQLDeviceProtect(deviceId)
    setProtect(kept && typeof kept === 'object' ? kept : null)
    const via =
      (answer && typeof answer === 'object' && answer.exit?.id) ||
      (kept && typeof kept === 'object' && kept.on === false && kept.route)
    setPublicExit(via ? !!(await graphQLProxyPublicExit(via)) : false)
    // The exit group it goes through: one shared with you, or one its networks make available, is chosen as the group,
    // and one with no device taking its traffic now — none left in it, or none offering itself — is chosen still, its
    // traffic stopped until one does, or dormant, going its usual way, while no device in it is in service. Asked where
    // it can be either.
    const exitGroup =
      answer && typeof answer === 'object' && (!answer.exit || offered.length || networks.length)
        ? await graphQLDeviceExitGroup(deviceId)
        : null
    setThrough(
      exitGroup
        ? { label: exitGroup.label, name: exitGroup.group?.name || exitGroup.label, dormant: exitGroup.dormant }
        : null
    )
  }, [deviceId, choice])

  useEffect(() => {
    load()
  }, [load])

  const waiting = through && info && !info.exit ? through : null
  return { info, chooser, exits, shared, given, protect, publicExit, group, through, waiting, load }
}

// The exit the device's traffic goes out through, with who chose it and what the machine's administrator allows.
export const DeviceExitChoice: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const { info, chooser, exits, shared, given, protect, publicExit, through, waiting, load } = useDeviceExit(
    device.id,
    true
  )
  const [saving, setSaving] = useState(false)
  const manage = device.permissions.includes('MANAGE')
  // The device's own exit traffic is charged to its account, the owner's, not to whoever views it.
  const usage = useTransferUsageHint(device.owner?.id, 'exit', manage && publicExit)

  if (!info) return null

  // A group shared with you, or one its networks make available, is chosen as the group, whichever of its devices takes
  // the traffic: shown as itself.
  const sharedThrough =
    through && (shared.some(g => g.label === through.label) || given.some(g => g.id === through.label))
      ? through.label
      : ''
  const current = sharedThrough || info.exit?.id || waiting?.label || ''
  const choices = [
    { key: '', name: t('deviceExit.none', 'None — its usual way out') },
    ...exits.map(e => ({ key: e.id, name: e.name })),
    ...shared.map(g => ({ key: g.label, name: sharedChoiceName(t, g) })),
    ...given.map(g => ({
      key: g.id,
      name: t('deviceExit.networkGroup', '{{group}} · by its network', { group: g.name }),
    })),
  ]
  if (info.exit && !sharedThrough && !exits.some(e => e.id === info.exit?.id))
    choices.push({ key: info.exit.id, name: info.exit.name })
  if (waiting && !choices.some(c => c.key === waiting.label)) choices.push({ key: waiting.label, name: waiting.name })

  // The machine's administrator's policy holds over the portal: under local or never, nothing is chosen here.
  const policy = chooser?.exitPolicy
  const locked = policy === 'local' || policy === 'never'
  const chosenBy = info.exit ? chosenLine(t, chooser) : null
  const policyText = policyLine(t, chooser)
  // Protect off on the device, with the exit it would route through: said, and turned on through it by choosing that
  // exit here — the device takes the newer choice, as it takes any. Not while its exit is dormant: Protect is off for it
  // until a device in its group is in service, and the group cannot be chosen meanwhile.
  const route = !info.exit && !waiting?.dormant && protect?.on === false && protect.route ? protect.route : null
  const routeName = route ? protect?.routeName || exits.find(e => e.id === route)?.name || route : null
  const choose = async (via: string | null) => {
    if (saving) return
    setSaving(true)
    if ((await graphQLSetDeviceExit(device.id, via)) !== 'ERROR') await load()
    setSaving(false)
  }

  return (
    <>
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
          onChange={via => choose(via || null)}
        />
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
      {waiting &&
        (waiting.dormant ? (
          <ListItemSetting
            icon="moon"
            iconColor="grayDarker"
            label={t('deviceExit.groupDormant', 'Its exit, {{group}}, is dormant', { group: waiting.name })}
            subLabel={t(
              'deviceExit.groupDormantHint',
              'No device in the group is in service, so its traffic goes its usual way, Protect off for it, until one is — then it goes out through the group again by itself. Or choose another exit.'
            )}
          />
        ) : (
          <ListItemSetting
            icon="triangle-exclamation"
            iconColor="warning"
            label={t('deviceExit.groupWaiting', 'No device in {{group}} takes its traffic now', {
              group: waiting.name,
            })}
            subLabel={t(
              'deviceExit.groupWaitingHint',
              'Its traffic stops until one does: a device added to the group, or one in it offering itself again. Or choose another exit.'
            )}
          />
        ))}
      {chosenBy && <ListItemSetting icon="user" label={chosenBy} />}
      {policyText && <ListItemSetting icon="lock" label={policyText.label} subLabel={policyText.hint} />}
    </>
  )
}

// Whether the device offers itself as an exit node, and its local network with it: rows of the caller's list.
export const DeviceExitOffer: React.FC<{ device: IDevice; settings?: DeviceSettings }> = ({ device, settings }) => {
  const { t } = useTranslation()
  const { info, group, load } = useDeviceExit(device.id, false)
  const [saving, setSaving] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const manage = device.permissions.includes('MANAGE')

  if (!info) return null

  const exitNode = settings?.setting('exit_node')
  const offer = async (value: { on: boolean; lan: boolean }) => {
    setSaving(true)
    if (await settings?.set('exit_node', value)) await load()
    setSaving(false)
  }
  // The last device in its group, and in it as an exit alone: turned off, the group is left with no exit — kept, or
  // deleted too, the device taken out of it first.
  const last = settingOn(exitNode) && lastInGroup(group, device.id) && group?.members?.[0].kind === 'exit'
  const offWithGroup = async (deleted: ProxyGroup) => {
    setSaving(true)
    if (await settings?.set('exit_node', { on: false, lan: !!exitNode?.value?.lan })) {
      const refused =
        refusalOf(await graphQLLeaveProxyGroup(device.id)) ??
        refusalOf(await graphQLDeleteProxyGroup(deleted.label, true))
      if (refused !== undefined)
        setRefusal(refused || t('deviceExit.groupNotDeleted', 'Its group could not be deleted.'))
      await load()
    }
    setSaving(false)
  }

  return (
    <>
      {manage && exitNode ? (
        <>
          <DeviceSettingRow
            setting={exitNode}
            icon="door-open"
            label={t('deviceExit.offer', 'Offer itself as an exit node')}
            subLabel={t(
              'deviceExit.offersHint',
              'People you allow (its share or role says exit) can send their traffic out through it'
            )}
            disabled={saving}
            confirm={settingOn(exitNode) && !last}
            confirmProps={{
              title: t('deviceExit.offerOffConfirm', 'Stop offering it as an exit node?'),
              children: exitOffLine(t, group, device.id),
            }}
            onChange={on => (last && !on ? setLeaving(true) : offer({ on, lan: !!exitNode.value?.lan }))}
          />
          {last && group && (
            <LastInGroupDialog
              open={leaving}
              group={group}
              device={device.name}
              action="exit"
              busy={saving}
              onCancel={() => setLeaving(false)}
              onKeep={() => {
                setLeaving(false)
                offer({ on: false, lan: !!exitNode.value?.lan })
              }}
              onDelete={() => {
                setLeaving(false)
                offWithGroup(group)
              }}
            />
          )}
          {refusal && (
            <Notice severity="error" fullWidth onClose={() => setRefusal(undefined)}>
              {refusal}
            </Notice>
          )}
          {settingOn(exitNode) && (
            <DeviceSettingRow
              setting={exitNode}
              icon="network-wired"
              label={t('deviceExit.lan', 'Its local network too')}
              subLabel={t('deviceExit.lanHint', 'Traffic sent out through it may reach the network it is on')}
              on={!!exitNode.value?.lan}
              quiet
              disabled={saving}
              confirm={!exitNode.value?.lan}
              confirmProps={{
                title: t('deviceExit.lanOnConfirm', 'Let its local network be reached?'),
                children: t(
                  'deviceExit.lanOnConfirmBody',
                  'Everyone who may use it as an exit can then reach the devices on the network it is on.'
                ),
              }}
              onChange={lan => offer({ on: !!exitNode.value?.on, lan })}
            />
          )}
        </>
      ) : (
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
      )}
    </>
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
