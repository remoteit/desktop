import React from 'react'
import { makeStyles, Chip, TextField, MenuItem, Divider, TextFieldProps } from '@material-ui/core'
import { ROLE } from '../models/organization'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { getActiveAccountId } from '../models/accounts'
import { spacing } from '../styling'
import { useHistory } from 'react-router-dom'

export const AccountSelect: React.FC<TextFieldProps> = props => {
  const css = useStyles()
  const history = useHistory()
  const { accounts, devices } = useDispatch<Dispatch>()
  const { user, options, activeId, orgName } = useSelector((state: ApplicationState) => ({
    user: state.auth.user || { id: '', email: '' },
    activeId: getActiveAccountId(state),
    options: state.accounts.membership.map(m => ({ id: m.organization.id, name: m.organization.name, role: m.role })),
    orgName: state.organization.name,
  }))

  options.sort((a, b) => (a.name > b.name ? 1 : -1))
  options.unshift({ id: user.id, name: orgName || user.email, role: 'OWNER' })
  if (options.length < 2) return null

  return (
    <TextField
      {...props}
      select
      variant="filled"
      value={activeId}
      className={css.selectMenu}
      onChange={async event => {
        const id = event.target.value as string
        if (id) {
          await accounts.setActive(id.toString())
          devices.set({ query: '', searched: false, from: 0 })
          devices.fetch()
          // history.push('/devices')
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
  )
}

const useStyles = makeStyles(({ palette }) => ({
  selectMenu: { '& .MuiChip-root': { display: 'none' } },
  menu: {
    display: 'flex',
    justifyContent: 'space-between',
    '& .MuiChip-root': { color: palette.gray.main, marginLeft: spacing.md },
  },
  divider: { marginTop: spacing.sm, marginBottom: spacing.xs },
}))
