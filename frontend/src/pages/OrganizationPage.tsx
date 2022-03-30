import React, { useEffect } from 'react'
import { Dispatch, ApplicationState } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, List } from '@material-ui/core'
import { selectOwner } from '../models/organization'
import { getRemoteitLicense } from '../models/licensing'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { OrganizationMemberList } from '../components/OrganizationMemberList'
import { LicensingNoticeDisplay } from '../components/LicensingNoticeDisplay'
import { OrganizationOptionMenu } from '../components/OrganizationOptionMenu'
import { LoadingMessage } from '../components/LoadingMessage'
import { SeatsSetting } from '../components/SeatsSetting'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationPage: React.FC = () => {
  const { organization, license, owner } = useSelector((state: ApplicationState) => ({
    organization: state.organization,
    license: getRemoteitLicense(state),
    owner: selectOwner(state),
  }))
  const dispatch = useDispatch<Dispatch>()
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
            <Title>Organization</Title>
            {organization.id && (
              <>
                <IconButton title="Add member" icon="user-plus" to="/account/organization/share" size="md" />
                <OrganizationOptionMenu organization={organization} />
              </>
            )}
          </Typography>
          {organization.id && (
            <List>
              <InlineTextFieldSetting
                hideIcon
                value={organization.name}
                label="Name"
                resetValue={organization.name}
                onSave={name => dispatch.organization.setOrganization(name.toString())}
              />
              <SeatsSetting license={license} />
              <Gutters>
                <Typography variant="body2" color="textSecondary">
                  Add members to your organization to automatically share all of your devices. &nbsp;
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
      {!organization.initialized ? (
        <LoadingMessage />
      ) : (
        <OrganizationMemberList organization={organization} owner={owner} enterprise={enterprise} />
      )}
    </Container>
  )
}
