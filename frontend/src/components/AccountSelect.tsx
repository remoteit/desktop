import React, { useState } from 'react'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useLocation, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Chip, TextField, MenuItem, Divider, ListItem } from '@material-ui/core'
import { getOwnOrganization, memberOrganization } from '../models/organization'
import { getActiveAccountId } from '../models/accounts'
import { spacing } from '../styling'

export const AccountSelect: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const [open, setOpen] = useState<boolean>(false)
  const { accounts, devices, tags } = useDispatch<Dispatch>()
  const { user, options, activeId, orgName } = useSelector((state: ApplicationState) => ({
    user: state.auth.user || { id: '', email: '' },
    activeId: getActiveAccountId(state),
    options: state.accounts.membership.map(m => ({
      id: m.account.id,
      name: memberOrganization(state.organization.all, m.account.id).name || 'Personal',
      roleId: m.roleId,
      roleName: m.roleName,
    })),
    orgName: getOwnOrganization(state).name,
  }))

  options.sort((a, b) => (a.name > b.name ? 1 : -1))
  options.unshift({ id: user.id, name: orgName || 'Personal', roleId: 'OWNER', roleName: 'Owner' })
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
          const menu = location.pathname.match(REGEX_FIRST_PATH)
          if (id) {
            await accounts.setActive(id.toString())
            devices.fetchIfEmpty()
            tags.fetchIfEmpty()
            if (menu && menu[0] === '/devices') history.push('/devices')
          }
        }}
      >
        {options.map(option => (
          <MenuItem className={css.menu} value={option.id} key={option.id}>
            {option.name}
            <Chip label={option.roleName} size="small" />
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
