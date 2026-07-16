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
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

type IAccountOption = { id: string; label: string }

export const AgentReachDialog: React.FC<{ agent: IAuthorizedAgent; open: boolean; onClose: () => void }> = ({
  agent,
  open,
  onClose,
}) => {
  const dispatch = useDispatch<Dispatch>()

  const { accountOptions, tagOptions } = useSelector((state: State) => {
    const me = state.auth.user?.id || state.user.id
    const email = state.auth.user?.email || state.user.email
    const accountOptions: IAccountOption[] = [
      { id: me, label: email ? `${email} (you)` : 'My devices' },
      ...state.accounts.membership.map(m => ({ id: m.account.id, label: m.account.email })),
    ]
    const names = new Set<string>()
    Object.values(state.tags.all || {}).forEach(list => (list || []).forEach(tag => names.add(tag.name)))
    return { accountOptions, tagOptions: Array.from(names) }
  })

  const [accounts, setAccounts] = useState<IAccountOption[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [operator, setOperator] = useState<ITagOperator>('ANY')

  // Seed the form from the agent's current reach each time the dialog opens.
  useEffect(() => {
    if (!open) return
    const reach = agent.reach
    setAccounts(reach?.accounts ? reach.accounts.map(id => accountOptions.find(a => a.id === id) || { id, label: id }) : [])
    setTags(reach?.tags || [])
    setOperator(reach?.tagOperator || 'ANY')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const limited = accounts.length > 0 || tags.length > 0

  function save() {
    dispatch.agents.setLimit({
      clientId: agent.clientId,
      accounts: accounts.length ? accounts.map(a => a.id) : null,
      tags: tags.length ? tags : null,
      operator,
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
          Restrict which of your devices this app can see. Leaving both empty lets it reach all of
          your devices. Limits apply on its next request and only ever narrow what it can already access.
        </Typography>
        <Box mt={3}>
          <Autocomplete
            multiple
            options={accountOptions}
            getOptionLabel={option => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={accounts}
            onChange={(_, value) => setAccounts(value)}
            renderInput={params => <TextField {...params} variant="filled" label="Accounts — default: all" />}
          />
        </Box>
        <Box mt={3}>
          <Autocomplete
            multiple
            freeSolo
            options={tagOptions}
            value={tags}
            onChange={(_, value) => setTags(value as string[])}
            renderInput={params => <TextField {...params} variant="filled" label="Tags — default: none" />}
          />
        </Box>
        {tags.length > 1 && (
          <Box mt={3}>
            <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
              Devices must match
            </Typography>
            <ToggleButtonGroup exclusive size="small" value={operator} onChange={(_, value) => value && setOperator(value)}>
              <ToggleButton value="ANY">Any tag</ToggleButton>
              <ToggleButton value="ALL">All tags</ToggleButton>
            </ToggleButtonGroup>
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
          {limited ? 'Save limits' : 'Allow all'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
