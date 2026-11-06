import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List } from '@mui/material'
import { graphQLSetShareExit, graphQLShareExit } from '../services/graphQLProxy'
import { ProxyGroup, graphQLDeviceGroup, proxyGroupSharesServed } from '../services/graphQLProxyGroups'
import { groupOrNone } from '../helpers/proxyGroupHelper'
import { ListItemSetting } from './ListItemSetting'
import { ProxyGroupShareDialog } from './ProxyGroupShareDialog'

/* Whether a person the device is shared with may use it as an exit node: its own grant, never implied by connect
   access (presence-server docs/proxy-plan.md §8). A device in an own group is used as an exit through its group, and a
   share of the device gives nothing on the group (graphql-api docs/PROXY-GROUPS.md §11, "The bridge, retired"): there
   the exit is the group's to share, so this says so and opens the group's share dialog for the person, in place of a
   toggle graphql refuses. Device sessions only; nothing shows where the API lacks it. */
export const ShareExitSetting: React.FC<{ device: IDevice; email: string }> = ({ device, email }) => {
  const { t } = useTranslation()
  const [exit, setExit] = useState<boolean>()
  const [group, setGroup] = useState<ProxyGroup | null>()
  const [sharing, setSharing] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    // Asked only of an API that shares groups: an older one still takes the toggle.
    const own = (await proxyGroupSharesServed()) ? groupOrNone(await graphQLDeviceGroup(device.id)) : null
    setGroup(own && !own.remoteit ? own : null)
    if (own && !own.remoteit) return
    const answer = await graphQLShareExit(device.id, email)
    setExit(typeof answer === 'boolean' ? answer : undefined)
  }, [device.id, email])

  useEffect(() => {
    load()
  }, [load])

  if (!device.permissions.includes('MANAGE')) return null

  if (group) {
    const shared = !!group.access?.some(a => a.user.email?.toLowerCase() === email.toLowerCase())
    return (
      <List>
        <ListItemSetting
          icon="arrow-right-from-bracket"
          label={t('shareExit.label', 'Use as an exit node')}
          subLabel={
            shared
              ? t('shareExit.groupShared', 'Through its group, {{group}}, which is shared with them', {
                  group: group.name,
                })
              : t('shareExit.groupHint', 'Through its group, {{group}}: share the group to let them', {
                  group: group.name,
                })
          }
          button={group.members ? t('shareExit.shareGroup', 'Share group') : undefined}
          onButtonClick={() => setSharing(true)}
        />
        {sharing && (
          <ProxyGroupShareDialog
            group={group}
            open
            emails={shared ? [] : [email]}
            onClose={() => setSharing(false)}
            onChanged={load}
          />
        )}
      </List>
    )
  }

  if (exit === undefined) return null

  return (
    <List>
      <ListItemSetting
        icon="arrow-right-from-bracket"
        label={t('shareExit.label', 'Use as an exit node')}
        subLabel={t('shareExit.hint', 'Send their traffic out through this device, as a VPN would')}
        toggle={exit}
        disabled={saving}
        onClick={async () => {
          setSaving(true)
          if ((await graphQLSetShareExit(device.id, email, !exit)) !== 'ERROR') await load()
          setSaving(false)
        }}
      />
    </List>
  )
}
