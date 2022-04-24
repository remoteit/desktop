import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { Typography, List } from '@material-ui/core'
import { selectOwner } from '../models/organization'
import { REMOTEIT_PRODUCT_ID } from '../models/licensing'
import { getOrganization } from '../models/organization'
import { OrganizationMemberList } from '../components/OrganizationMemberList'
import { LicensingNoticeDisplay } from '../components/LicensingNoticeDisplay'
import { SeatsSetting } from '../components/SeatsSetting'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationMembersPage: React.FC = () => {
  const { organization, license, owner } = useSelector((state: ApplicationState) => {
    const organization = getOrganization(state)
    return {
      organization,
      license: organization.licenses.find(l => l.plan.product.id === REMOTEIT_PRODUCT_ID) || null,
      owner: selectOwner(state),
    }
  })
  const enterprise = !license?.plan?.billing

  useEffect(() => {
    analyticsHelper.page('OrganizationPage')
  }, [])

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
            <List>
              <SeatsSetting license={license} />
              <Gutters>
                <Typography variant="body2" color="textSecondary">
                  Add members to your organization to automatically share your devices. &nbsp;
                  {!enterprise && (
                    <b>
                      Unlicensed members will only be able to connect to the first five and can not be device admins.
                    </b>
                  )}
                </Typography>
              </Gutters>
              <LicensingNoticeDisplay noticeType="PERSONAL_ORGANIZATION" license={license} />
            </List>
          )}
        </>
      }
    >
      <OrganizationMemberList organization={organization} owner={owner} enterprise={enterprise} />
    </Container>
  )
}
