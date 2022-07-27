import React from 'react'
import classnames from 'classnames'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useLocation, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles } from '@mui/styles'
import { Typography, Box, List, ListItem } from '@mui/material'
import { getOwnOrganization, getOrganization, getOrganizationName } from '../models/organization'
import { IconButton } from '../buttons/IconButton'
import { fontSizes } from '../styling'
import { Avatar } from './Avatar'

export const OrganizationSelect: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const { accounts, devices, tags, networks, logs } = useDispatch<Dispatch>()
  const { options, activeOrg, ownOrg, userId } = useSelector((state: ApplicationState) => ({
    activeOrg: getOrganization(state),
    options: state.accounts.membership.map(m => ({
      id: m.account.id,
      email: m.account.email,
      name: getOrganizationName(state, m.account.id),
      roleId: m.roleId,
      roleName: m.roleName,
    })),
    ownOrg: getOwnOrganization(state),
    userId: state.user.id,
  }))

  const ownOrgId = ownOrg?.id || userId
  const onSelect = async id => {
    const menu = location.pathname.match(REGEX_FIRST_PATH)
    if (id) {
      await logs.reset()
      await accounts.setActive(id.toString())
      networks.fetchIfEmpty()
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
        <Typography variant="h4">{activeOrg.name || 'Organizations'}</Typography>
      </Box>
      <List dense>
        <ListItem onClick={() => onSelect(ownOrgId || userId)} disableGutters>
          <IconButton
            className={classnames(css.button, ownOrgId === activeOrg.id && css.active)}
            title={ownOrg?.id ? `${ownOrg.name} - Owner` : 'Personal Account'}
            icon="house"
            size="md"
            color={ownOrgId === activeOrg.id ? 'black' : 'grayDarkest'}
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
            size="lg"
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
