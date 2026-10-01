import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListItem, ListItemText, ListSubheader } from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { TaggedInto, graphQLRemoveNetworkDeviceRule, graphQLTaggedInto } from '../services/graphQLDeviceNetworks'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { IconButton } from '../buttons/IconButton'

/* Where this account's tags reach: other accounts' networks taking its devices by its tags, each set by someone who
   administers both (presence-server docs/device-principals.md §2). Tagging a device here can put it on those networks,
   so its administrators see them, and may withdraw one. Beside the device-agent settings on Profile and an
   organization's Settings; hidden without the device-sessions flag, where the API does not serve it, and when there
   are none. */
export const TaggedIntoList: React.FC<{ accountId?: string }> = ({ accountId }) => {
  const { t } = useTranslation()
  const enabled = useDeviceSessions()
  const [rules, setRules] = useState<TaggedInto[]>()
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const result = await graphQLTaggedInto(accountId || '')
    if (result !== 'ERROR' && result !== UNSUPPORTED) setRules(result)
  }

  useEffect(() => {
    if (enabled) load()
  }, [enabled, accountId])

  if (!enabled || !rules?.length) return null

  const withdraw = async (rule: TaggedInto) => {
    if (!window.confirm(t('taggedInto.confirm', 'Take these devices off {{name}}?', { name: rule.network?.name })))
      return
    setBusy(true)
    await graphQLRemoveNetworkDeviceRule(rule.id)
    await load()
    setBusy(false)
  }

  const what = (rule: TaggedInto) =>
    [
      rule.initiator && t('deviceNetwork.groupInitiators', 'initiators'),
      rule.anyPort
        ? t('deviceNetwork.groupAnyPort', 'targets: all services · any port')
        : rule.allServices && t('deviceNetwork.groupAllServices', 'targets: all services'),
      rule.devices.length === 1
        ? t('deviceNetwork.groupDevice', '1 device')
        : t('deviceNetwork.groupDevices', '{{count}} devices', { count: rule.devices.length }),
      rule.addedByEmail && t('taggedInto.addedBy', 'added by {{email}}', { email: rule.addedByEmail }),
    ]
      .filter(Boolean)
      .join(' · ')

  return (
    <List>
      <ListSubheader>{t('taggedInto.title', 'Your tags feed these networks')}</ListSubheader>
      {rules.map(rule => (
        <ListItem
          key={rule.id}
          secondaryAction={
            <IconButton
              icon="times"
              title={t('taggedInto.withdraw', 'Withdraw')}
              size="sm"
              disabled={busy}
              onClick={() => withdraw(rule)}
            />
          }
        >
          <ListItemText
            primary={t('taggedInto.rule', '{{tags}} → {{network}} ({{owner}})', {
              tags: rule.tags.join(rule.operator === 'ALL' ? ' + ' : ' or '),
              network: rule.network?.name,
              owner: rule.network?.owner.email,
            })}
            secondary={what(rule)}
          />
        </ListItem>
      ))}
    </List>
  )
}
