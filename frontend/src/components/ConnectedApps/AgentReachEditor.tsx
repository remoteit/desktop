import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../../store'
import { Chip, List, Typography } from '@mui/material'
import { ListItemSetting } from '../ListItemSetting'
import { TagEditor } from '../TagEditor'
import { Gutters } from '../Gutters'
import { Avatar } from '../Avatar'
import { Tags } from '../Tags'
import { spacing } from '../../styling'
import { useAccountLabel } from './helpers'

// Inline editor for an agent's device reach: each account gets an on/off toggle and the
// standard tag picker. Changes apply optimistically, like tag edits elsewhere in the app.
export const AgentReachEditor: React.FC<{ agent: IAuthorizedAgent }> = ({ agent }) => {
  const dispatch = useDispatch<Dispatch>()
  const accountLabel = useAccountLabel()
  const allTags = useSelector((state: State) => state.tags.all)
  const meId = useSelector((state: State) => state.auth.user?.id || state.user.id)
  const meEmail = useSelector((state: State) => state.auth.user?.email || state.user.email)
  const membership = useSelector((state: State) => state.accounts.membership)

  const accountIds = [meId, ...membership.map(m => m.account.id)].filter(Boolean)

  // Avatar keyed on the account email with the org name as its initial fallback — the same
  // colored circle the organization picker shows.
  const accountAvatar = (id: string) => {
    const org = membership.find(m => m.account.id === id)
    const email = id === meId ? meEmail : org?.account.email
    return <Avatar email={email} fallback={id === meId ? meEmail : org?.name} size={spacing.lg} />
  }

  // Load each account's own tags for its picker (no-op when already cached).
  useEffect(() => {
    accountIds.forEach(id => dispatch.tags.fetchIfEmpty(id))
  }, [accountIds.join()])

  // null reach = no limit; render that as every account checked with no tags.
  const unlimited = agent.reach == null
  const rules: IAccountReach[] = unlimited
    ? accountIds.map(id => ({ account: id, tags: null, operator: 'ANY' }))
    : agent.reach || []

  // Persist a new rule set; full reach (every account, no tags) is stored as "no limit".
  const apply = (next: IAccountReach[]) => {
    const full = accountIds.length > 0 && accountIds.every(id => next.some(r => r.account === id && !r.tags?.length))
    dispatch.agents.setLimit({ clientId: agent.clientId, accounts: full ? null : next })
  }

  const toggleAccount = (id: string, checked: boolean) => {
    const base = rules.filter(r => r.account !== id)
    apply(checked ? [...base, { account: id, tags: null, operator: 'ANY' }] : base)
  }

  const updateRule = (id: string, patch: Partial<IAccountReach>) =>
    apply(rules.map(r => (r.account === id ? { ...r, ...patch } : r)))

  const name = agent.clientName || 'This app'
  const tagged = rules.filter(r => r.tags?.length).length
  let summary
  if (unlimited) summary = `${name} can reach all devices in every account you belong to.`
  else if (!rules.length) summary = `${name} cannot reach any devices.`
  else {
    const scope =
      rules.length >= accountIds.length
        ? 'every account you belong to'
        : `${rules.length} of ${accountIds.length} accounts`
    const limits = tagged ? `, limited to tagged devices in ${tagged === 1 ? 'one' : `${tagged} of them`}` : ''
    summary = `${name} can reach ${scope}${limits}.`
  }

  return (
    <>
      <Gutters top={null} bottom={null}>
        <Typography variant="body2" sx={{ marginBottom: 0.5 }}>
          {summary}
        </Typography>
        <Typography variant="caption" display="block">
          Turn on the accounts and organizations it may access. Add tags to limit an account to matching devices only.
        </Typography>
      </Gutters>
      <List>
      {accountIds.map(id => {
        const rule = rules.find(r => r.account === id)
        const accountTags = allTags[id] || []
        const selected: ITag[] = (rule?.tags || []).map(
          name => accountTags.find(t => t.name === name) || { name, color: 0 }
        )
        return (
          <React.Fragment key={id}>
            <ListItemSetting
              icon={accountAvatar(id)}
              label={accountLabel(id)}
              toggle={!!rule}
              onClick={() => toggleAccount(id, !rule)}
            />
            {rule && (
              <Gutters inset="icon" top={null} bottom="sm">
                {rule.tags?.length ? (
                  <Tags
                    tags={selected}
                    onDelete={tag => {
                      const tags = (rule.tags || []).filter(name => name !== tag.name)
                      updateRule(id, { tags: tags.length ? tags : null })
                    }}
                  />
                ) : (
                  <Chip
                    label="All devices"
                    size="small"
                    sx={{ fontWeight: 500, letterSpacing: 1, color: 'grayDarker.main' }}
                  />
                )}
                <TagEditor
                  tags={accountTags}
                  filter={selected}
                  placeholder="Add tag..."
                  allowAdding={false}
                  keyboardShortcut={false}
                  onSelect={tag => updateRule(id, { tags: [...(rule.tags || []), tag.name] })}
                />
                {(rule.tags?.length || 0) > 1 && (
                  <Chip
                    size="small"
                    variant="outlined"
                    sx={{ marginLeft: 1 }}
                    label={rule.operator === 'ALL' ? 'Match: all tags' : 'Match: any tag'}
                    onClick={() => updateRule(id, { operator: rule.operator === 'ALL' ? 'ANY' : 'ALL' })}
                  />
                )}
              </Gutters>
            )}
          </React.Fragment>
        )
      })}
      </List>
    </>
  )
}
