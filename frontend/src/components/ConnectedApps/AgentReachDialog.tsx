import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../../store'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { IconButton } from '../../buttons/IconButton'

type IAccountOption = { id: string; label: string }
type IRule = { account: string; tags: string[]; operator: ITagOperator }

export const AgentReachDialog: React.FC<{ agent: IAuthorizedAgent; open: boolean; onClose: () => void }> = ({
  agent,
  open,
  onClose,
}) => {
  const dispatch = useDispatch<Dispatch>()

  const { accountOptions, tagsByAccount } = useSelector((state: State) => {
    const me = state.auth.user?.id || state.user.id
    const email = state.auth.user?.email || state.user.email
    const accountOptions: IAccountOption[] = [
      { id: me, label: email ? `${email} (you)` : 'Your devices' },
      ...state.accounts.membership.map(m => ({ id: m.account.id, label: m.account.email })),
    ]
    const tagsByAccount: { [id: string]: string[] } = {}
    Object.entries(state.tags.all || {}).forEach(([id, list]) => (tagsByAccount[id] = (list || []).map(t => t.name)))
    return { accountOptions, tagsByAccount }
  })

  const [rules, setRules] = useState<IRule[]>([])

  // Seed from the agent's current per-account reach each time the dialog opens.
  useEffect(() => {
    if (!open) return
    setRules((agent.reach?.accounts || []).map(r => ({ account: r.account, tags: r.tags || [], operator: r.operator })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const used = new Set(rules.map(r => r.account))
  const addable = accountOptions.filter(o => !used.has(o.id))
  const labelFor = (id: string) => accountOptions.find(o => o.id === id)?.label || id

  const updateRule = (i: number, patch: Partial<IRule>) =>
    setRules(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const removeRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i))

  function save() {
    dispatch.agents.setLimit({
      clientId: agent.clientId,
      accounts: rules.length
        ? rules.map(r => ({ account: r.account, tags: r.tags.length ? r.tags : null, operator: r.operator }))
        : null,
    })
    onClose()
  }

  function clearAll() {
    dispatch.agents.clearLimit(agent.clientId)
    onClose()
  }

  return (
    <Dialog onClose={onClose} open={open} fullWidth maxWidth="sm">
      <DialogTitle>Limit {agent.clientName || 'this app'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Choose which accounts this app can reach, and optionally limit each to specific device tags.
          With no accounts added it can reach all your devices. Limits apply on its next request and
          only ever narrow its access.
        </Typography>

        {rules.map((rule, i) => (
          <Box key={rule.account} mt={2} p={1.5} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2">{labelFor(rule.account)}</Typography>
              <IconButton icon="times" size="sm" title="Remove account" onClick={() => removeRule(i)} />
            </Stack>
            <Autocomplete
              multiple
              freeSolo
              size="small"
              options={tagsByAccount[rule.account] || []}
              value={rule.tags}
              onChange={(_, value) => updateRule(i, { tags: value as string[] })}
              renderInput={params => (
                <TextField {...params} variant="filled" label="Tags — leave empty for all devices" />
              )}
            />
            {rule.tags.length > 1 && (
              <Box mt={1}>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={rule.operator}
                  onChange={(_, value) => value && updateRule(i, { operator: value })}
                >
                  <ToggleButton value="ANY">Any tag</ToggleButton>
                  <ToggleButton value="ALL">All tags</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}
          </Box>
        ))}

        {addable.length > 0 && (
          <Box mt={2}>
            <Autocomplete
              key={`add-${rules.length}`}
              size="small"
              options={addable}
              getOptionLabel={option => option.label}
              value={null}
              onChange={(_, value) => value && setRules([...rules, { account: (value as IAccountOption).id, tags: [], operator: 'ANY' }])}
              renderInput={params => <TextField {...params} variant="filled" label="Add an account…" />}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={clearAll} disabled={!agent.reach}>
          Clear limits
        </Button>
        <Box flexGrow={1} />
        <Button color="primary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={save}>
          {rules.length ? 'Save limits' : 'Allow all'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
