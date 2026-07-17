import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../../store'
import { Chip, Collapse, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { ExpandIcon } from '../ExpandIcon'
import { TagEditor } from '../TagEditor'
import { Gutters } from '../Gutters'
import { Tags } from '../Tags'
import { Icon } from '../Icon'
import { agentIsLimited, reachSummary, useAccountLabel } from './helpers'

// Inline expand/collapse editor for an agent's device reach. The collapsed row shows the
// current summary; expanded, each account gets a checkbox and the standard tag picker.
// Changes apply immediately, like tag edits elsewhere in the app.
export const AgentReachEditor: React.FC<{ agent: IAuthorizedAgent }> = ({ agent }) => {
  const [open, setOpen] = useState(false)
  const dispatch = useDispatch<Dispatch>()
  const accountLabel = useAccountLabel()
  const updating = useSelector((state: State) => state.agents.updating === agent.clientId)
  const allTags = useSelector((state: State) => state.tags.all)
  const meId = useSelector((state: State) => state.auth.user?.id || state.user.id)
  const membership = useSelector((state: State) => state.accounts.membership)

  const accountIds = [meId, ...membership.map(m => m.account.id)].filter(Boolean)

  // Load each account's own tags for its picker (no-op when already cached).
  useEffect(() => {
    if (open) accountIds.forEach(id => dispatch.tags.fetchIfEmpty(id))
  }, [open])

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

  return (
    <>
      <ListItemButton onClick={() => setOpen(!open)} dense>
        <ListItemIcon>
          <Icon name={agentIsLimited(agent) ? 'lock' : 'globe'} size="md" fixedWidth />
        </ListItemIcon>
        <ListItemText
          primary={reachSummary(agent.reach, accountLabel)}
          secondary="Choose the accounts and device tags this app can reach"
        />
        {updating ? <Icon name="spinner-third" spin color="primary" inlineLeft /> : <ExpandIcon open={open} />}
      </ListItemButton>
      <Collapse in={open}>
        <List disablePadding>
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
                  subLabel={rule && !rule.tags?.length ? 'All devices' : undefined}
                  checked={!!rule}
                  disabled={updating}
                  onClick={checked => toggleAccount(id, checked)}
                />
                {rule && (
                  <Gutters inset="icon" top={null} bottom="sm">
                    <Tags
                      tags={selected}
                      onDelete={tag => {
                        const tags = (rule.tags || []).filter(name => name !== tag.name)
                        updateRule(id, { tags: tags.length ? tags : null })
                      }}
                    />
                    <TagEditor
                      tags={accountTags}
                      filter={selected}
                      placeholder="Add tag..."
                      allowAdding={false}
                      keyboardShortcut={false}
                      disabled={updating}
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
      </Collapse>
    </>
  )
}
