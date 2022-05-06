import React, { useState } from 'react'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useLocation, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Tooltip, Divider, List, ListItem } from '@material-ui/core'
import { getOwnOrganization, memberOrganization } from '../models/organization'
import { getActiveAccountId } from '../models/accounts'
import { IconButton } from '../buttons/IconButton'
import { AvatarMenu } from './AvatarMenu'
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
  // options.unshift({ id: user.id, email: user.email, name: orgName || 'Personal', roleId: 'OWNER', roleName: 'Owner' })
  if (options.length < 2) return null

  return (
    <List>
      <ListItem className={css.menu} disableGutters>
        <IconButton icon="home" size="lg" type="light" />
      </ListItem>

      {options.map(option => (
        <ListItem className={css.menu} key={option.id} onClick={() => onSelect(option.id)} disableGutters>
          <Avatar
            size={40}
            email={option.email}
            title={`${option.name} - ${option.roleName}`}
            active={option.id === activeId}
            button
            tooltip
          />
        </ListItem>
      ))}
      <ListItem className={css.menu} disableGutters>
        <IconButton title="Memberships" icon="ellipsis-h" to="/devices/membership" />
      </ListItem>
    </List>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  menu: { justifyContent: 'center' },
}))
