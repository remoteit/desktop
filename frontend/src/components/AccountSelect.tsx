import React, { useState } from 'react'
import { makeStyles, Chip, TextField, MenuItem, Divider, ListItem } from '@material-ui/core'
import { ROLE } from '../models/organization'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { getActiveAccountId } from '../models/accounts'
import { spacing } from '../styling'
import { useHistory } from 'react-router-dom'

export const AccountSelect: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const [open, setOpen] = useState<boolean>(false)
  const { accounts, devices, tags } = useDispatch<Dispatch>()
  const { user, options, activeId, orgName } = useSelector((state: ApplicationState) => ({
    user: state.auth.user || { id: '', email: '' },
    activeId: getActiveAccountId(state),
    options: state.accounts.membership.map(m => ({ id: m.organization.id, name: m.organization.name, role: m.role })),
    orgName: state.organization.name,
  }))

  options.sort((a, b) => (a.name > b.name ? 1 : -1))
  options.unshift({ id: user.id, name: orgName || 'Personal', role: 'OWNER' })
  if (options.length < 2) return null

  return (
    <ListItem dense className={css.wrapper} button onClick={() => setOpen(!open)}>
      <TextField
        select
        fullWidth
        onSelect={() => setOpen(false)}
        SelectProps={{ open }}
        label="Organization"
        value={activeId}
        className={css.selectMenu}
        onChange={async event => {
          const id = event.target.value as string
          if (id) {
            await accounts.setActive(id.toString())
            devices.set({ query: '', searched: false, from: 0 })
            devices.fetch()
            tags.fetch()
          }
        }}
      >
        {options.map(option => (
          <MenuItem className={css.menu} value={option.id} key={option.id}>
            {option.name}
            <Chip label={ROLE[option.role]} size="small" />
          </MenuItem>
        ))}
        <Divider className={css.divider} />
        <MenuItem onClick={() => history.push('/devices/membership')}>Manage memberships...</MenuItem>
      </TextField>
    </ListItem>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  wrapper: { marginTop: spacing.md },
  selectMenu: { '& .MuiChip-root': { display: 'none' }, marginLeft: spacing.sm },
  menu: {
    display: 'flex',
    justifyContent: 'space-between',
    '& .MuiChip-root': { color: palette.gray.main, marginLeft: spacing.md },
  },
  divider: { marginTop: spacing.sm, marginBottom: spacing.xs },
}))
