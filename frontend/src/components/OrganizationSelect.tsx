import React, { useState } from 'react'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useLocation, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Chip, Divider, List, ListItem } from '@material-ui/core'
import { getOwnOrganization, memberOrganization } from '../models/organization'
import { getActiveAccountId } from '../models/accounts'
import { IconButton } from '../buttons/IconButton'
import { Avatar } from './Avatar'
import { spacing } from '../styling'

export const OrganizationSelect: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const { accounts, devices, tags, logs } = useDispatch<Dispatch>()
  const { user, options, activeId, orgName } = useSelector((state: ApplicationState) => ({
    user: state.auth.user || { id: '', email: '' },
    activeId: getActiveAccountId(state),
    options: state.accounts.membership.map(m => ({
      id: m.account.id,
      email: m.account.email,
      name: memberOrganization(state.organization.all, m.account.id).name || 'Personal',
      roleId: m.roleId,
      roleName: m.roleName,
    })),
    orgName: getOwnOrganization(state).name,
  }))

  const onSelect = async id => {
    const menu = location.pathname.match(REGEX_FIRST_PATH)
    if (id) {
      await logs.reset()
      await accounts.setActive(id.toString())
      devices.fetchIfEmpty()
      tags.fetchIfEmpty()
      if (menu && menu[0] === '/devices') history.push('/devices')
    }
  }

  options.sort((a, b) => (a.name > b.name ? 1 : -1))
  options.unshift({ id: user.id, email: user.email, name: orgName || 'Personal', roleId: 'OWNER', roleName: 'Owner' })
  if (options.length < 2) return null

  return (
    <List>
      {options.map(option => (
        <ListItem className={css.menu} key={option.id} onClick={() => onSelect(option.id)}>
          <Avatar email={option.email} title={`${option.name} - ${option.roleName}`} size={40} button tooltip />
        </ListItem>
      ))}
      <Divider className={css.divider} />
      <ListItem onClick={() => history.push('/devices/membership')}>
        <IconButton title="Manage memberships" icon="ellipsis-h" />
      </ListItem>
    </List>
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
