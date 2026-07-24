import React from 'react'
import { State } from '../store'
import { Redirect } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, List } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ENTERPRISE_PLAN_ID } from '../models/plans'
import { selectRemoteitLicense, selectPermissions, selectOrganization, selectOwner } from '../selectors/organizations'
import { OrganizationMemberList } from '../components/OrganizationMemberList'
import { LicensingNoticeDisplay } from '../components/LicensingNoticeDisplay'
import { SeatsSetting } from '../components/SeatsSetting'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'

export const OrganizationMembersPage: React.FC = () => {
  const organization = useSelector(selectOrganization)
  const permissions = useSelector(selectPermissions)
  const license = useSelector(selectRemoteitLicense) || null
  const owner = useSelector(selectOwner)
  const userId = useSelector((state: State) => state.user.id)
  const enterprise = license?.plan.id === ENTERPRISE_PLAN_ID
  const { t } = useTranslation()

  if (!permissions.includes('ADMIN'))
    return <Redirect to={{ pathname: `/organization/account/${userId}`, state: { isRedirect: true } }} />

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{t('organizationMembersPage.title', 'Members')}</Title>
            {organization?.id && (
              <IconButton title={t('organizationMembersPage.addMember', 'Add member')} icon="user-plus" to="/organization/add" size="md" />
            )}
          </Typography>
          {organization?.id && (
            <>
              <SeatsSetting context="user" />
              <Gutters bottom={null}>
                <Typography variant="body2" color="textSecondary">
                  {t('organizationMembersPage.autoShareNotice', 'Members will automatically have devices shared to them.')} &nbsp;
                  {!enterprise && (
                    <b>
                      {t(
                        'organizationMembersPage.unlicensedLimit',
                        'Unlicensed members will only be able to connect to the first five devices.'
                      )}
                    </b>
                  )}
                </Typography>
              </Gutters>
              <List>
                <LicensingNoticeDisplay noticeType="PERSONAL_ORGANIZATION" license={license} />
              </List>
            </>
          )}
        </>
      }
    >
      <OrganizationMemberList organization={organization} owner={owner} enterprise={enterprise} />
    </Container>
  )
}
