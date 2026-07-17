import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../../store'
import { Chip, List, Typography } from '@mui/material'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { TagEditor } from '../TagEditor'
import { Gutters } from '../Gutters'
import { Tags } from '../Tags'
import { Icon } from '../Icon'
import { useAccountLabel } from './helpers'

// Inline editor for an agent's device reach: each account gets a checkbox and the standard
// tag picker. Changes apply optimistically, like tag edits elsewhere in the app.
export const AgentReachEditor: React.FC<{ agent: IAuthorizedAgent }> = ({ agent }) => {
  const dispatch = useDispatch<Dispatch>()
  const accountLabel = useAccountLabel()
  const allTags = useSelector((state: State) => state.tags.all)
  const meId = useSelector((state: State) => state.auth.user?.id || state.user.id)
  const membership = useSelector((state: State) => state.accounts.membership)

  const accountIds = [meId, ...membership.map(m => m.account.id)].filter(Boolean)

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
  const summary = unlimited
    ? `${name} can reach all devices in every account you belong to.`
    : !rules.length
    ? `${name} cannot reach any devices.`
    : `${name} is limited to ${rules.length} of ${accountIds.length} account${accountIds.length === 1 ? '' : 's'}.`

  return (
    <>
      <Gutters top={null} bottom={null}>
        <Typography variant="body2" gutterBottom>
          <Icon name={unlimited ? 'globe' : 'lock'} size="sm" color="grayDark" inlineLeft />
          {summary}
        </Typography>
        <Typography variant="caption" display="block">
          Check the accounts and organizations it may access. Add tags to limit an account to matching devices only.
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
            <ListItemCheckbox
              label={accountLabel(id)}
              checked={!!rule}
              onClick={checked => toggleAccount(id, checked)}
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
