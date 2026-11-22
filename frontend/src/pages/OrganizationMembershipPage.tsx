import React from 'react'
import { useTranslation } from 'react-i18next'
import { State, Dispatch } from '../store'
import {
  Typography,
  Divider,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { selectRemoteitLicense } from '../selectors/organizations'
import { getOwnOrganization } from '../models/organization'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { LicenseChip } from '../components/LicenseChip'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Duration } from '../components/Duration'
import { spacing } from '../styling'
import { Notice } from '../components/Notice'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'
import { Body } from '../components/Body'

const AVATAR_SIZE = 32

export const OrganizationMembershipPage: React.FC = () => {
  const { memberships, organization, license, email } = useSelector((state: State) => ({
    memberships: state.accounts.membership,
    organization: getOwnOrganization(state),
    license: selectRemoteitLicense(state, state.user.id),
    email: state.user.email || '',
  }))
  const { accounts } = useDispatch<Dispatch>()
  const { t } = useTranslation()
  const narrow = useMediaQuery(useTheme().breakpoints.down('sm'))
  const textSx = { paddingRight: narrow ? 0 : '220px' }
  const chips = (role: React.ReactNode, license: React.ReactNode) => (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {role}
      {narrow ? (
        license
      ) : (
        <Box width={100} display="inline-block" textAlign="right" marginRight={`${spacing.md}px`}>
          {license}
        </Box>
      )}
    </Box>
  )
  const ownerChip = organization && (
    <Chip label={organization.roles.find(r => r.id === 'OWNER')?.name} size="small" />
  )
  const ownerLicense = <LicenseChip license={license?.valid ? 'LICENSED' : 'UNLICENSED'} />
  const below = (secondary: React.ReactNode, role: React.ReactNode, license: React.ReactNode) =>
    narrow ? (
      <>
        {secondary}
        <Box component="span" sx={{ display: 'block', marginTop: 0.5 }}>
          {chips(role, license)}
        </Box>
      </>
    ) : (
      secondary
    )

  return (
    <Container
      header={
        <Typography variant="h1">
          <Title>{t('organizationMembershipPage.title', 'Organization memberships')}</Title>
        </Typography>
      }
    >
      {memberships.length ? (
        <List>
          {organization && (
            <>
              <ListItem key={organization.id}>
                <ListItemIcon>
                  <Avatar email={email} title={organization.name} size={AVATAR_SIZE} />
                </ListItemIcon>
                <ListItemText
                  sx={textSx}
                  primary={organization.name}
                  secondary={below(
                    t('organizationMembershipPage.yourOrganization', 'Your organization'),
                    ownerChip,
                    ownerLicense
                  )}
                  secondaryTypographyProps={{ component: 'div' }}
                />
                <ListItemSecondaryAction>
                  {!narrow && chips(ownerChip, ownerLicense)}
                  <IconButton
                    icon="pencil"
                    title={t('organizationMembershipPage.editOrganization', 'Edit organization')}
                    to="/organization"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider variant="inset" />
            </>
          )}
          {memberships.map(m => (
            <ListItem key={m.roleId}>
              <ListItemIcon>
                <Avatar email={m.account.email} fallback={m.name} size={AVATAR_SIZE} />
              </ListItemIcon>
              <ListItemText
                sx={textSx}
                primary={m.name}
                secondaryTypographyProps={{ component: 'div' }}
                secondary={below(
                  <>
                    {m.account.email && (
                      <>
                        {t('organizationMembershipPage.owner', 'Owner')} <b>{m.account.email}</b>
                        {' · '}
                      </>
                    )}
                    {t('organizationMembershipPage.joined', 'Joined')}{' '}
                    <Duration startTime={m.created.getTime()} ago />
                  </>,
                  <Chip label={m.roleName} size="small" />,
                  <LicenseChip license={m.license} />
                )}
              />
              <ListItemSecondaryAction>
                {!narrow && chips(<Chip label={m.roleName} size="small" />, <LicenseChip license={m.license} />)}
                <ConfirmIconButton
                  confirm
                  icon="sign-out"
                  title={t('organizationMembershipPage.leaveAccount', 'Leave account')}
                  confirmProps={{
                    color: 'error',
                    action: t('organizationMembershipPage.leaveOrganization', 'Leave organization'),
                    title: t('common.areYouSure', 'Are you sure?'),
                    children: (
                      <Notice severity="error" gutterBottom fullWidth>
                        {t('organizationMembershipPage.cannotBeUndone', 'This action cannot be undone.')}
                        <em>
                          {m.standalone
                            ? t('organizationMembershipPage.contactAdminHint', 'Contact an organization Admin to rejoin.')
                            : t(
                                'organizationMembershipPage.contactOwnerHint',
                                'You would need to contact the Organization owner to be re-added.'
                              )}
                        </em>
                      </Notice>
                    ),
                  }}
                  onClick={() => accounts.leaveMembership(m.account.id)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Body center>
          <Typography variant="h2" gutterBottom>
            {t('organizationMembershipPage.noMemberships', 'No organization memberships')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t(
              'organizationMembershipPage.noMembershipsHint',
              'Organizations can add you to their account to provide access to the devices they own.'
            )}
          </Typography>
        </Body>
      )}
    </Container>
  )
}
