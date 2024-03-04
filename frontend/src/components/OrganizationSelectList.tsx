import React from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { ListItemButton, ListSubheader, ListItemIcon, ListItemText, Chip } from '@mui/material'
import { getOwnOrganization } from '../models/organization'
import { selectOrganization } from '../selectors/organizations'
import { IconButton } from '../buttons/IconButton'
import { Avatar } from './Avatar'

const AVATAR_SIZE = 28

export const OrganizationSelectList: React.FC = () => {
  const history = useHistory()
  const { accounts, devices, tags, networks, logs } = useDispatch<Dispatch>()
  const { options, activeOrg, ownOrg, user } = useSelector((state: State) => ({
    activeOrg: selectOrganization(state),
    options: state.accounts.membership.map(m => {
      const org = selectOrganization(state, m.account.id)
      return {
        id: m.account.id,
        email: m.account.email,
        name: org.name,
        roleId: m.roleId,
        roleName: m.roleName,
        disabled: !org.id,
      }
    }),
    ownOrg: getOwnOrganization(state),
    user: state.user,
  }))

  const ownOrgId = ownOrg?.id
  const onSelect = async (id: string) => {
    if (id) {
      await logs.reset()
      await accounts.set({ activeId: id.toString() })
      networks.fetchIfEmpty()
      devices.fetchIfEmpty()
      tags.fetchIfEmpty()
      history.push('/devices')
    }
  }

  options.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
  if (!options.length) return null

  return (
    <>
      <ListSubheader disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Organizations
        <IconButton
          size="sm"
          icon="ellipsis-v"
          color="grayDark"
          title="Membership Settings"
          to="/organization/memberships"
          buttonBaseSize="small"
        />
      </ListSubheader>
      <ListItemButton
        dense
        disableGutters
        selected={ownOrgId === activeOrg.id}
        onClick={() => onSelect(ownOrgId || user.id)}
      >
        <ListItemIcon>
          <Avatar size={AVATAR_SIZE} email={user.email} />
        </ListItemIcon>
        <ListItemText primary={ownOrg?.id ? ownOrg.name : 'Personal Account'} />
        <Chip label="Owner" size="small" />
      </ListItemButton>
      {options.map(option => (
        <ListItemButton
          key={option.id}
          dense
          disableGutters
          disabled={option.disabled}
          selected={option.id === activeOrg.id}
          onClick={() => onSelect(option.id)}
        >
          <ListItemIcon>
            <Avatar size={AVATAR_SIZE} email={option.email} fallback={option.name} />
          </ListItemIcon>
          <ListItemText primary={option.name} />
          <Chip label={option.roleName} size="small" />
        </ListItemButton>
      ))}
    </>
  )
}
