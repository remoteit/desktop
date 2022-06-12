import React from 'react'
import classnames from 'classnames'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useLocation, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Typography, Box, List, ListItem } from '@material-ui/core'
import { getOwnOrganization, getOrganization, memberOrganization } from '../models/organization'
import { IconButton } from '../buttons/IconButton'
import { fontSizes } from '../styling'
import { Avatar } from './Avatar'

export const OrganizationSelect: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const { accounts, devices, tags, logs } = useDispatch<Dispatch>()
  const { options, activeOrg, ownOrgId } = useSelector((state: ApplicationState) => ({
    activeOrg: getOrganization(state),
    options: state.accounts.membership.map(m => ({
      id: m.account.id,
      email: m.account.email,
      name: memberOrganization(state.organization.all, m.account.id).name || 'Personal',
      roleId: m.roleId,
      roleName: m.roleName,
    })),
    ownOrgId: getOwnOrganization(state).id || state.user.id,
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

  options.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
  if (!options.length) return null

  return (
    <>
      <Box className={css.name}>
        <Typography variant="h4">{activeOrg.name}</Typography>
      </Box>
      <List dense>
        <ListItem onClick={() => onSelect(ownOrgId)} disableGutters>
          <IconButton
            className={classnames(css.button, ownOrgId === activeOrg.id && css.active)}
            title="Personal Account"
            icon="home-lg-alt"
            size="md"
            color={ownOrgId === activeOrg.id ? 'black' : 'grayDark'}
            placement="right"
          />
        </ListItem>
        {options.map(option => (
          <ListItem key={option.id} onClick={() => onSelect(option.id)} disableGutters>
            <Avatar
              email={option.email}
              title={`${option.name} - ${option.roleName}`}
              active={option.id === activeOrg.id}
              button
              tooltip
            />
          </ListItem>
        ))}
        <ListItem disableGutters>
          <IconButton
            className={css.button}
            title="Memberships"
            icon="ellipsis-h"
            to="/organization/memberships"
            placement="right"
          />
        </ListItem>
      </List>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  button: {
    borderRadius: '50%',
    width: 38,
    height: 38,
    margin: 2,
  },
  active: {
    border: `2px solid ${palette.primary.main}`,
    boxShadow: `0 0 10px ${palette.primaryLight.main}`,
    background: palette.grayLightest.main,
  },
  name: {
    transform: 'rotate(270deg)',
    transformOrigin: 'center',
    whiteSpace: 'nowrap',
    position: 'relative',
    height: '2em',
    '& > *': {
      position: 'absolute',
      right: 0,
      color: palette.grayDarkest.main,
      fontWeight: 300,
      letterSpacing: '0.15em',
      fontSize: fontSizes.base,
      textTransform: 'uppercase',
    },
  },
}))
