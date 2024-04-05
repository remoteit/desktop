import React from 'react'
import { Redirect } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { Typography, List, ListSubheader } from '@mui/material'
import { selectPermissions, selectOrganization } from '../selectors/organizations'
import { OrganizationSAMLSettings } from '../components/OrganizationSAMLSettings'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ResellerSettings } from '../components/ResellerSettings'
import { DeleteButton } from '../buttons/DeleteButton'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

export const OrganizationSettingsPage: React.FC = () => {
  const organization = useSelector(selectOrganization)
  const permissions = useSelector(selectPermissions)
  const isOrgOwner = useSelector((state: State) => organization.id === state.user.id)
  const dispatch = useDispatch<Dispatch>()

  if (!permissions?.includes('ADMIN'))
    return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container
      gutterBottom
      bodyProps={{ inset: false }}
      header={
        <Typography variant="h1">
          <Title>Settings</Title>
          {isOrgOwner && (
            <DeleteButton
              title="Delete Organization"
              warning={
                <>
                  <Notice severity="error" fullWidth gutterBottom>
                    You will be permanently deleting <i>{organization.name}. </i>
                  </Notice>
                  This will remove all your members and their access to your devices.
                </>
              }
              onDelete={async () => await dispatch.organization.removeOrganization()}
            />
          )}
        </Typography>
      }
    >
      <List>
        <ResellerSettings reseller={organization.reseller} />
        <ListSubheader>General</ListSubheader>
        <InlineTextFieldSetting
          icon="industry-alt"
          value={organization.name}
          label="Organization Name"
          resetValue={organization.name}
          onSave={name => dispatch.organization.setOrganization({ name: name.toString() })}
        />
      </List>
      <OrganizationSAMLSettings />
    </Container>
  )
}
