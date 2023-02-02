import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useLocation, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Typography, Tooltip, ButtonBase, Box, List, ListItem } from '@mui/material'
import { getOwnOrganization, getOrganizationName } from '../models/organization'
import { selectOrganization } from '../selectors/organizations'
import { IconButton } from '../buttons/IconButton'
import { fontSizes } from '../styling'
import { Avatar } from './Avatar'
import { Pre } from './Pre'

export const OrganizationSelect: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const { accounts, devices, tags, networks, logs } = useDispatch<Dispatch>()
  const { options, activeOrg, ownOrg, userId, defaultSelection } = useSelector((state: ApplicationState) => ({
    activeOrg: selectOrganization(state),
    defaultSelection: state.ui.defaultSelection,
    options: state.accounts.membership.map(m => ({
      id: m.account.id,
      email: m.account.email,
      name: getOrganizationName(state, m.account.id),
      roleId: m.roleId,
      roleName: m.roleName,
      disabled: !selectOrganization(state, m.account.id).id,
    })),
    ownOrg: getOwnOrganization(state),
    userId: state.user.id,
  }))

  const ownOrgId = ownOrg?.id
  const onSelect = async (id: string) => {
    const menu = location.pathname.match(REGEX_FIRST_PATH)?.[0] || ''
    if (id) {
      await logs.reset()
      await accounts.setActive(id.toString())
      networks.fetchIfEmpty()
      devices.fetchIfEmpty()
      tags.fetchIfEmpty()
      if (['/devices', '/networks'].includes(menu)) {
        history.push(defaultSelection[id]?.[menu] || menu)
      }
    }
  }

  options.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
  if (!options.length) return null

  return (
    <>
      <Box className={css.name}>
        <Typography variant="h4">{activeOrg.name || 'Organizations'}</Typography>
      </Box>
      <List dense className={css.list}>
        <ListItem disableGutters className={css.buttonContainer}>
          <IconButton
            onClick={() => onSelect(ownOrgId || userId)}
            className={classnames(css.button, ownOrgId === activeOrg.id && css.active)}
            title={ownOrg?.id ? `${ownOrg.name} - Owner` : 'Personal Account'}
            icon="house"
            size="md"
            color={ownOrgId === activeOrg.id ? 'black' : 'grayDarkest'}
            placement="right"
          />
        </ListItem>
        {options.map(option => (
          <Tooltip
            key={option.id}
            title={`${option.name} - ${option.roleName}`}
            placement="right"
            enterDelay={800}
            arrow
          >
            <ListItem disableGutters>
              <ButtonBase disabled={option.disabled} onClick={() => onSelect(option.id)}>
                <Avatar
                  email={option.email}
                  fallback={option.name}
                  active={option.id === activeOrg.id}
                  button={!option.disabled}
                />
              </ButtonBase>
            </ListItem>
          </Tooltip>
        ))}
        <ListItem disableGutters className={css.buttonContainer}>
          <IconButton
            className={css.button}
            title="Memberships"
            icon="ellipsis-h"
            to="/organization/memberships"
            placement="right"
            size="md"
          />
        </ListItem>
      </List>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    '& > *': {
      display: 'flex',
      justifyContent: 'center',
      borderRadius: '50%',
      height: 51,
      padding: 0,
    },
  },
  buttonContainer: {
    width: 38,
  },
  button: {
    borderRadius: '50%',
    width: 38,
    height: 38,
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
