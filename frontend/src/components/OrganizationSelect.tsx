import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useLocation, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Typography, Tooltip, ButtonBase, Box, Badge, Divider, List, ListItem } from '@mui/material'
import { getOwnOrganization } from '../models/organization'
import { selectOrganization } from '../selectors/organizations'
import { GuideBubble } from './GuideBubble'
import { IconButton } from '../buttons/IconButton'
import { fontSizes } from '../styling'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

export const OrganizationSelect: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const { accounts, devices, tags, networks, logs } = useDispatch<Dispatch>()
  const { options, activeOrg, ownOrg, userId, defaultSelection, sessions } = useSelector((state: ApplicationState) => ({
    activeOrg: selectOrganization(state),
    defaultSelection: state.ui.defaultSelection,
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
    sessions: state.sessions.all,
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
      if (['/devices', '/networks', '/connections'].includes(menu)) {
        history.push(defaultSelection[id]?.[menu] || menu)
      }
    }
  }

  options.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
  if (!options.length) return null

  const mySessions = sessions.filter(s => s.target.accountId === ownOrg?.id).length

  return (
    <>
      <Box className={css.name}>
        <Typography variant="h4">{activeOrg.name || 'Organizations'}</Typography>
      </Box>
      <GuideBubble
        guide="organizationSelect"
        placement="right"
        startDate={new Date('2023-01-01')}
        queueAfter="addDevice"
        instructions={
          <>
            <Typography variant="h3" gutterBottom>
              <b>Select an organization</b>
            </Typography>
            <Typography variant="body2" gutterBottom>
              See devices, networks and logs that belong to this organization.
            </Typography>
          </>
        }
      >
        <List dense className={css.list}>
          <Badge
            overlap="circular"
            classes={{ badge: css.badge }}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            badgeContent={mySessions}
          >
            <Tooltip
              title={<Title primary={ownOrg?.id ? `${ownOrg.name} - Owner` : 'Personal Account'} count={mySessions} />}
              placement="right"
              enterDelay={800}
              arrow
            >
              <ListItem disableGutters className={css.buttonContainer}>
                <ButtonBase
                  className={classnames(css.button, ownOrgId === activeOrg.id && css.active)}
                  onClick={() => onSelect(ownOrgId || userId)}
                >
                  <Box className={css.home}>
                    <Icon size="md" name="house" color={ownOrgId === activeOrg.id ? 'black' : 'grayDarkest'} />
                  </Box>
                </ButtonBase>
              </ListItem>
            </Tooltip>
          </Badge>
          {options.map(option => {
            const count = sessions.filter(s => s.target.accountId === option.id).length
            return (
              <Badge
                key={option.id}
                overlap="circular"
                classes={{ badge: css.badge }}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                badgeContent={count}
              >
                <Tooltip
                  title={<Title primary={`${option.name} - ${option.roleName}`} count={count} />}
                  placement="right"
                  enterDelay={800}
                  arrow
                >
                  <ListItem disableGutters>
                    <ButtonBase
                      disabled={option.disabled}
                      onClick={() => onSelect(option.id)}
                      className={classnames(css.button, option.id === activeOrg.id && css.active)}
                    >
                      <Avatar email={option.email} fallback={option.name} size={38} border={2} />
                    </ButtonBase>
                  </ListItem>
                </Tooltip>
              </Badge>
            )
          })}
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
      </GuideBubble>
    </>
  )
}

function Title({ primary, count }: { primary: string; count: number }) {
  return (
    <>
      {primary}
      {!!count && (
        <>
          <Divider />
          {count} active connection{count > 1 ? 's' : ''}
        </>
      )}
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
    border: `2px solid ${palette.grayLighter.main}`,
    transition: 'border-color 0.5s',
    width: 42,
    height: 42,
  },
  active: {
    borderColor: palette.primary.main,
    boxShadow: `0 0 10px ${palette.primaryLight.main}`,
    '& > *': { border: `2px solid ${palette.grayLightest.main}` },
    '& > .MuiBox-root': { backgroundColor: palette.grayLightest.main },
    '&::before': {
      content: '""',
      position: 'absolute',
      right: -16,
      borderTop: '6px solid transparent',
      borderRight: `8px solid ${palette.primary.main}`,
      borderBottom: '6px solid transparent',
    },
  },
  home: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white.main,
  },
  badge: {
    fontWeight: 600,
    marginTop: 3,
    marginLeft: 1,
    color: palette.alwaysWhite.main,
    backgroundColor: palette.primary.main,
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
  // fade: {
  //   // opacity: 0.5,
  //   transition: 'opacity 0.4s',
  //   '&:hover': { opacity: 1 },
  // },
}))
