import React, { useEffect } from 'react'
import { Dispatch, ApplicationState } from '../store'
import { Typography, List } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { OrganizationMemberList } from '../components/OrganizationMemberList'
import { LoadingMessage } from '../components/LoadingMessage'
import { DeleteButton } from '../buttons/DeleteButton'
import { SeatsSetting } from '../components/SeatsSetting'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationPage: React.FC = () => {
  const organization = useSelector((state: ApplicationState) => state.organization)
  const [removing, setRemoving] = React.useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    analyticsHelper.page('OrganizationPage')
  }, [])

  return (
    <Container
      header={
        <>
          <Typography variant="h1">
            <Title>Organization</Title>
            {organization.id && (
              <>
                <DeleteButton
                  tooltip="Delete organization"
                  destroying={removing}
                  warning={
                    <>
                      You will be permanently deleting <i>{organization.name}. </i>
                      This will remove all your members and their access to your devices.
                    </>
                  }
                  onDelete={() => {
                    setRemoving(true)
                    dispatch.organization.removeOrganization()
                  }}
                />
                <IconButton title="Add member" icon="user-plus" to="/settings/organization/share" size="md" />
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
              <SeatsSetting />
              <Gutters>
                <Typography variant="body2" color="textSecondary">
                  Add members to your organization to automatically share all your devices and manage their access.
                </Typography>
              </Gutters>
            </List>
          )}
        </>
      }
    >
      {!organization.initialized ? <LoadingMessage /> : <OrganizationMemberList organization={organization} />}
    </Container>
  )
}
