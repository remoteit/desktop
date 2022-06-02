import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { Typography, List } from '@material-ui/core'
import { selectOwner } from '../models/organization'
import { selectRemoteitLicense } from '../models/plans'
import { selectPermissions, getOrganization } from '../models/organization'
import { OrganizationMemberList } from '../components/OrganizationMemberList'
import { LicensingNoticeDisplay } from '../components/LicensingNoticeDisplay'
import { SeatsSetting } from '../components/SeatsSetting'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { Body } from '../components/Body'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationMembersPage: React.FC = () => {
  const { organization, permissions, license, owner } = useSelector((state: ApplicationState) => {
    const organization = getOrganization(state)
    return {
      organization,
      permissions: selectPermissions(state),
      license: selectRemoteitLicense(state) || null,
      owner: selectOwner(state),
    }
  })
  const enterprise = !!license && !license.plan.billing

  useEffect(() => {
    analyticsHelper.page('OrganizationMembersPage')
  }, [])

  if (!permissions?.includes('ADMIN'))
    return (
      <Body center>
        <Typography variant="body2" color="textSecondary">
          Please contact the organization owner to request admin privileges.
        </Typography>
      </Body>
    )

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Members</Title>
            {organization?.id && <IconButton title="Add member" icon="user-plus" to="/organization/share" size="md" />}
          </Typography>
          {organization?.id && (
            <>
              <List disablePadding>
                <SeatsSetting license={license} />
              </List>
              <Gutters bottom={null}>
                <Typography variant="body2" color="textSecondary">
                  Members will automatically have devices shared to them. &nbsp;
                  {!enterprise && <b>Unlicensed members will only be able to connect to the first five devices.</b>}
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
