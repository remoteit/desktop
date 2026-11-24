import React from 'react'
import { useMobile } from '../hooks/useMobile'
import { useTranslation } from 'react-i18next'
import { useLocation, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { REGEX_FIRST_PATH } from '../constants'
import { Typography, Tooltip, ButtonBase, Box, Badge, Divider, List, ListItem, Theme } from '@mui/material'
import { getOwnOrganization } from '../models/organization'
import { selectAllConnectionSessions } from '../selectors/connections'
import { selectOrganization, selectRowAccount, selectSwitcherRows } from '../selectors/organizations'
import { selectActiveAccountId } from '../selectors/accounts'
import { selectSignInSub } from '../selectors/signIns'
import { GuideBubble } from './GuideBubble'
import { fontSizes } from '../styling'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { CreateOrganizationDialog } from './CreateOrganizationDialog'
import { CloseOrganizationDialog } from './CloseOrganizationDialog'
import { PendingOrganizationClosure } from '../models/accounts'

// The organization selector's guide shipped later than the rest — its own cohort cutoff
const ORG_GUIDE_DATE = new Date('2023-01-01')

const CLEAR_ID_BASE: Record<string, string> = {
  '/runs': '/runs',
  '/script': '/scripts',
  '/file': '/files',
}

const nameSx = (theme: Theme) => ({
  transform: 'rotate(270deg)',
  transformOrigin: 'center',
  whiteSpace: 'nowrap',
  position: 'relative' as const,
  height: '2em',
  '& > .MuiTypography-root': {
    position: 'absolute',
    right: 0,
    color: theme.palette.grayDarkest.main,
    letterSpacing: '0.15em',
    fontSize: fontSizes.base,
    textTransform: 'uppercase',
  },
})

const listSx = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.grayLighter.main,
  boxShadow: `0 0 10px 10px ${theme.palette.grayLighter.main}`,
  marginBottom: 3,
  '& > *': { display: 'flex', justifyContent: 'center', borderRadius: '50%', height: 51, padding: 0 },
})

const badgeSx = {
  '& .MuiBadge-badge': {
    fontWeight: 700,
    marginTop: '3px',
    marginLeft: '1px',
    color: 'alwaysWhite.main',
    backgroundColor: 'primary.main',
  },
}

// Whose a shared organization's row is: a small mark of the account on the avatar's corner.
const ACCOUNT_BADGE = 16
const accountBadgeSx = (theme: Theme) => ({
  width: ACCOUNT_BADGE + 4,
  height: ACCOUNT_BADGE + 4,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  backgroundColor: theme.palette.white.main,
  border: `2px solid ${theme.palette.grayLighter.main}`,
  // The avatar inside is only a mark here: it neither explains itself nor takes the click.
  pointerEvents: 'none' as const,
})

const buttonContainerSx = { width: 42 }

const buttonSx = (theme: Theme) => ({
  borderRadius: '50%',
  border: `2px solid ${theme.palette.grayLighter.main}`,
  transition: 'border-color 0.5s',
  width: 42,
  height: 42,
  '&:hover': { borderColor: theme.palette.primaryLight.main },
})

const activeSx = (theme: Theme) => ({
  borderColor: theme.palette.primary.main,
  boxShadow: `0 0 10px ${theme.palette.primaryLight.main}`,
  '& > *': { border: `2px solid ${theme.palette.grayLightest.main}` },
  '& > .MuiBox-root': { backgroundColor: theme.palette.grayLightest.main },
  '&::before': {
    content: '""',
    position: 'absolute',
    right: -16,
    borderTop: '6px solid transparent',
    borderRight: `8px solid ${theme.palette.primary.main}`,
    borderBottom: '6px solid transparent',
  },
})

const homeSx = {
  width: 42,
  height: 38,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'white.main',
}

export const OrganizationSelect: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const location = useLocation()
  const mobile = useMobile()
  const { accounts } = useDispatch<Dispatch>()

  let activeOrg = useSelector(selectOrganization)
  const defaultSelection = useSelector((state: State) => state.ui.defaultSelection)
  // A row for each account an organization is reached through: picking one says who the person acts as there.
  const options = useSelector(selectSwitcherRows)

  const ownOrg = useSelector(getOwnOrganization)
  const sessions = useSelector(selectAllConnectionSessions)
  const userId = useSelector((state: State) => state.user.id)
  const canCreate = useSelector((state: State) => state.accounts.standaloneOrganizations)
  const pending = useSelector((state: State) => state.accounts.pendingOrganizationClosures)
  const [creating, setCreating] = React.useState(false)
  const [closing, setClosing] = React.useState<PendingOrganizationClosure>()

  const ownOrgId = ownOrg?.id
  const activeAccountId = useSelector(selectActiveAccountId)
  let menu = location.pathname.match(REGEX_FIRST_PATH)?.[0] || ''

  // The row that is selected, by account: a signed-in account with no organization has no org id to compare, and its
  // own row would otherwise leave the mark on the house.
  const houseId = ownOrgId || userId
  const selectedId = menu === '/account' ? houseId : activeAccountId || houseId
  // Whose the selected row is, where another account here has a row for the same organization.
  const rowAccount = useSelector((state: State) => selectRowAccount(state, selectedId))
  // The page's own person's row is the selected one only while their own sign-in serves it; where another account
  // here belongs to it too, it says it is theirs.
  const houseLooked = useSelector((state: State) => !selectSignInSub(state, houseId))
  const houseAccount = useSelector((state: State) =>
    selectRowAccount(state, houseId) === undefined ? undefined : state.user.email
  )
  if (menu === '/account') {
    activeOrg = ownOrg
    menu = '/devices'
  }

  const onSelect = async (id: string, sub = '') => {
    id = id || userId
    await accounts.selectAs({ accountId: id.toString(), sub })
    if (mobile) return
    if (['/devices', '/networks', '/connections', '/products', '/partner-stats'].includes(menu)) {
      history.push(defaultSelection[id]?.[menu] || menu)
    } else if (CLEAR_ID_BASE[menu]) {
      // Clear stale resource IDs from the URL when switching accounts
      history.push(CLEAR_ID_BASE[menu])
    }
  }

  if (!options.length && !canCreate) return null

  const mySessions = sessions.filter(s => s.target.accountId === ownOrg?.id).length

  return (
    <>
      {creating && <CreateOrganizationDialog onClose={() => setCreating(false)} />}
      {closing && <CloseOrganizationDialog {...closing} onClose={() => setClosing(undefined)} />}
      <Box sx={nameSx}>
        <Typography variant="h4">
          {activeOrg.name || t('organizationSelect.organizations', 'Organizations')}
          {!!rowAccount && ` · ${rowAccount}`}
        </Typography>
      </Box>
      <GuideBubble
        sidebar
        guide="organizationSelect"
        placement="right"
        startDate={ORG_GUIDE_DATE}
        added={ORG_GUIDE_DATE}
        queueAfter="refresh"
        enterDelay={600}
        instructions={
          <>
            <Typography variant="h3" gutterBottom>
              <b>{t('organizationSelect.guideTitle', 'Select an organization')}</b>
            </Typography>
            <Typography variant="body2" gutterBottom>
              {t(
                'organizationSelect.guideDescription',
                'See devices, networks and logs that belong to this organization.'
              )}
            </Typography>
          </>
        }
      >
        <List dense sx={listSx} disablePadding>
          <Badge
            overlap="circular"
            sx={badgeSx}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            badgeContent={mySessions}
          >
            <Tooltip
              title={
                <Title
                  primary={
                    ownOrg?.id
                      ? t('organizationSelect.ownerLabel', { name: ownOrg.name, defaultValue: '{{name}} - Owner' })
                      : t('organizationSelect.personalAccount', 'Personal Account')
                  }
                  account={houseAccount}
                  count={mySessions}
                />
              }
              placement="right"
              enterDelay={800}
              arrow
            >
              <ListItem disableGutters sx={buttonContainerSx}>
                <ButtonBase
                  sx={[buttonSx, selectedId === houseId && houseLooked ? activeSx : {}]}
                  aria-current={(selectedId === houseId && houseLooked) || undefined}
                  onClick={() => onSelect(ownOrgId || userId)}
                >
                  <Box sx={homeSx}>
                    <Icon
                      size="md"
                      name="house"
                      color={selectedId === houseId && houseLooked ? 'black' : 'grayDarkest'}
                    />
                  </Box>
                </ButtonBase>
              </ListItem>
            </Tooltip>
          </Badge>
          {options.map(option => {
            const count = sessions.filter(s => s.target.accountId === option.id).length
            return (
              <Badge
                key={option.key}
                overlap="circular"
                sx={badgeSx}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                badgeContent={count}
              >
                <Tooltip
                  title={
                    <Title
                      primary={
                        option.signIn
                          ? option.name || option.email
                          : t('organizationSelect.memberLabel', {
                              name: option.name,
                              role: option.roleName,
                              defaultValue: '{{name}} - {{role}}',
                            })
                      }
                      // Whose the row is: another sign-in's, or any account's where two have a row for it.
                      account={option.signIn ? undefined : option.sub || option.shared ? option.account : undefined}
                      count={count}
                    />
                  }
                  placement="right"
                  enterDelay={800}
                  arrow
                >
                  <ListItem disableGutters>
                    <ButtonBase
                      disabled={option.disabled}
                      aria-current={(option.id === selectedId && option.looked) || undefined}
                      data-row={option.key}
                      onClick={() => onSelect(option.id, option.sub)}
                      sx={[buttonSx, option.id === selectedId && option.looked ? activeSx : {}]}
                    >
                      {option.shared ? (
                        // An organization with a row under more than one account: whose this row is, on its avatar —
                        // as that account's own row in the rail shows it (the house for the page's own person).
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            <Box sx={accountBadgeSx} role="img" aria-label={option.account} data-badge={option.account}>
                              {option.sub ? (
                                <Avatar email={option.account} size={ACCOUNT_BADGE} border={0} />
                              ) : (
                                <Icon size="xxs" name="house" color="grayDarkest" />
                              )}
                            </Box>
                          }
                        >
                          <Avatar email={option.email} fallback={option.name} size={38} border={2} />
                        </Badge>
                      ) : (
                        <Avatar email={option.email} fallback={option.name} size={38} border={2} />
                      )}
                    </ButtonBase>
                  </ListItem>
                </Tooltip>
              </Badge>
            )
          })}
          {canCreate && (
            <Tooltip title={t('createOrganization.title', 'Create organization')} placement="right" arrow>
              <ListItem disableGutters sx={buttonContainerSx}>
                <ButtonBase
                  sx={buttonSx}
                  aria-label={t('createOrganization.title', 'Create organization')}
                  onClick={() => setCreating(true)}
                >
                  <Icon size="md" name="plus" color="grayDarkest" />
                </ButtonBase>
              </ListItem>
            </Tooltip>
          )}
          {pending?.map(closure => (
            <Tooltip
              key={closure.organizationId}
              title={t('closeOrganization.resume', { name: closure.name, defaultValue: 'Resume closing {{name}}' })}
              placement="right"
              arrow
            >
              <ListItem disableGutters sx={buttonContainerSx}>
                <ButtonBase
                  sx={buttonSx}
                  aria-label={t('closeOrganization.resume', { name: closure.name, defaultValue: 'Resume closing {{name}}' })}
                  onClick={() => setClosing(closure)}
                >
                  <Icon size="md" name="trash" color="grayDarkest" />
                </ButtonBase>
              </ListItem>
            </Tooltip>
          ))}
          {/* <ListItem disableGutters sx={buttonContainerSx}>
            <IconButton
              sx={buttonSx}
              title="Memberships"
              icon="ellipsis-h"
              to="/organization/memberships"
              placement="right"
              size="md"
            />
          </ListItem> */}
        </List>
      </GuideBubble>
    </>
  )
}

function Title({ primary, account, count }: { primary: string; account?: string; count: number }) {
  const { t } = useTranslation()
  return (
    <>
      {primary}
      {!!account && (
        <>
          <br />
          {t('organizationSelect.via', { account, defaultValue: 'Via {{account}}' })}
        </>
      )}
      {!!count && (
        <>
          <Divider />
          {t('organizationSelect.activeConnectionsCount', {
            count,
            defaultValue_one: '{{count}} active connection',
            defaultValue_other: '{{count}} active connections',
          })}
        </>
      )}
    </>
  )
}
