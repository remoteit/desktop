import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Box, TextField, MenuItem } from '@mui/material'
import { State, Dispatch } from '../../store'

/* Org the agent is scoped to — defaults to the app's active org (models/chat
   syncOrg) but diverges freely; a change applies from the next turn */
export const ChatOrgSelect: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const orgId = useSelector((state: State) => state.chat.orgId)
  const userId = useSelector((state: State) => state.user.id)
  const memberships = useSelector((state: State) => state.accounts.membership)
  const organizations = useSelector((state: State) => state.organization.accounts)

  const options = memberships
    .map(m => ({ id: m.account.id, name: (organizations[m.account.id]?.name || m.name || '').trim() }))
    .filter(o => o.name)
    .sort((a, b) => a.name.localeCompare(b.name))

  if (!options.length) return null

  return (
    <Box sx={{ paddingX: 2, paddingBottom: 1 }}>
      <TextField
        select
        fullWidth
        size="small"
        label="Organization"
        value={orgId || userId}
        onChange={event => dispatch.chat.set({ orgId: event.target.value })}
        sx={{ '& .MuiSelect-select': { paddingY: '12px' } }}
      >
        <MenuItem value={userId}>Personal</MenuItem>
        {options.map(o => (
          <MenuItem key={o.id} value={o.id}>
            {o.name}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  )
}
