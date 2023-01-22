import React, { useState } from 'react'
import { Redirect } from 'react-router-dom'
import { REGEX_DOMAIN_SAFE } from '../shared/constants'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import {
  TextField,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'
import { getMembership } from '../models/accounts'
import { memberOrganization, selectPermissions } from '../models/organization'
import { selectLimitsLookup } from '../selectors/organizations'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { SelectSetting } from '../components/SelectSetting'
import { DeleteButton } from '../buttons/DeleteButton'
import { FileUpload } from '../components/FileUpload'
import { Container } from '../components/Container'
import { ColorChip } from '../components/ColorChip'
import { DataCopy } from '../components/DataCopy'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { Link } from '../components/Link'

type ProviderFormProps = {
  identityProviderEnabled?: boolean
  metadata?: string
  clientId?: string
  clientSecret?: string
  issuer?: string
  type: IOrganizationProvider
}

export const OrganizationSettingsPage: React.FC = () => {
  const { updating, domain, defaultDomain, samlOnly, isOrgOwner, organization, limits, permissions } = useSelector(
    (state: ApplicationState) => {
      const membership = getMembership(state)
      const organization = memberOrganization(state.organization.accounts, membership.account.id)
      return {
        organization,
        isOrgOwner: organization.id === state.auth.user?.id,
        updating: state.organization.updating,
        domain: organization.domain || '',
        defaultDomain: state.auth.user?.email.split('@')[1],
        samlOnly: !!organization.providers?.includes('SAML'),
        limits: selectLimitsLookup(state),
        permissions: selectPermissions(state),
      }
    }
  )
  const [checking, setChecking] = useState<boolean>(false)
  const [form, setForm] = useState<ProviderFormProps>({
    identityProviderEnabled: organization.identityProviderEnabled,
    type: 'SAML',
  })
  const dispatch = useDispatch<Dispatch>()

  const enable = () => {
    if (!form.metadata) return
    dispatch.organization.setIdentityProvider({
      accountId: organization?.id,
      enabled: true,
      metadata: form.metadata,
      type: 'SAML',
    })
  }

  const disable = () =>
    dispatch.organization.setIdentityProvider({ accountId: organization?.id, enabled: false, type: 'SAML' })

  const incomplete =
    (form.type === 'SAML' && !form.metadata) ||
    (form.type === 'OIDC' && !(form.clientId && form.clientSecret && form.issuer))

  if (!permissions?.includes('ADMIN')) return <Redirect to={'/organization'} />

  return (
    <Container
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
      <Typography variant="subtitle1">General</Typography>
      <List>
        <InlineTextFieldSetting
          icon="industry-alt"
          value={organization.name}
          label="Organization Name"
          resetValue={organization.name}
          onSave={name => dispatch.organization.setOrganization({ name: name.toString(), accountId: organization.id })}
        />
      </List>
      {limits.saml && (
        <>
          <List>
            <InlineTextFieldSetting
              icon="at"
              label="Domain"
              value={(domain || defaultDomain)?.toString()}
              displayValue={domain.toString()}
              resetValue={defaultDomain}
              filter={REGEX_DOMAIN_SAFE}
              onSave={async value => {
                await dispatch.organization.setOrganization({ domain: value.toString() })
                setTimeout(() => dispatch.organization.fetch(), 1000)
              }}
            />
            {domain ? (
              organization.verified ? (
                <ListItem>
                  <ListItemIcon />
                  <ListItemText
                    primary={
                      <ColorChip
                        label="Verified"
                        typeColor="alwaysWhite"
                        backgroundColor="primary"
                        icon={<Icon name="check" size="sm" fixedWidth inline />}
                      />
                    }
                  />
                </ListItem>
              ) : (
                <ListItem>
                  <ListItemIcon />
                  <Box display="flex" flexDirection="column">
                    <Typography variant="caption" gutterBottom>
                      Add the following CNAME and Value to your DNS records to validate your domain:
                      <Link href="https://link.remote.it/support/setup-domain">Instructions.</Link>
                    </Typography>
                    <DataCopy
                      value={organization.verificationCNAME}
                      label="Verification CNAME"
                      showBackground
                      fullWidth
                      gutterBottom
                    />
                    <DataCopy
                      value={organization.verificationValue}
                      label="Verification Value"
                      showBackground
                      fullWidth
                    />
                    <Box paddingTop={1} paddingBottom={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        disabled={!!checking}
                        onClick={async () => {
                          setChecking(true)
                          await dispatch.organization.fetch()
                          setChecking(false)
                        }}
                      >
                        {checking ? 'checking...' : 'Check domain'}
                      </Button>
                    </Box>
                  </Box>
                </ListItem>
              )
            ) : (
              <ListItem dense>
                <ListItemIcon />
                <Typography variant="caption" gutterBottom>
                  Enter your Organization's domain name.
                  <Link href="https://link.remote.it/support/setup-domain">Instructions.</Link>
                </Typography>
              </ListItem>
            )}
          </List>
          <Typography variant="subtitle1">Identity Provider</Typography>
          <List>
            {organization.verified ? (
              organization.identityProviderEnabled ? (
                <>
                  <ListItem dense>
                    <ListItemIcon>{/* <Icon name="sign-in" size="md" fixedWidth /> */}</ListItemIcon>
                    <ListItemText
                      primary={
                        <ColorChip
                          label="Enabled"
                          typeColor="alwaysWhite"
                          backgroundColor="primary"
                          icon={<Icon name="shield" size="sm" fixedWidth inline />}
                        />
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button variant="contained" disabled={updating} onClick={disable} size="small">
                        {updating ? 'Updating...' : 'Disable'}
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItemSetting
                    toggle={samlOnly}
                    label="Require login with identity provider"
                    subLabel="All organization members will not be able to login with email/password or Google."
                    disabled={!organization.verified}
                    onClick={() => dispatch.organization.setOrganization({ providers: samlOnly ? null : ['SAML'] })}
                    icon="shield-alt"
                  />
                </>
              ) : (
                <>
                  <SelectSetting
                    icon="sign-in"
                    label="Provider type"
                    value={form.type}
                    values={[
                      { key: 'SAML', name: 'SAML' },
                      { key: 'OIDC', name: 'OIDC' },
                    ]}
                    onChange={provider => setForm({ ...form, type: provider as IOrganizationProvider })}
                  />
                  {form.type === 'SAML' ? (
                    <>
                      <ListItem dense>
                        <ListItemIcon>
                          <Icon name="arrow-up-to-line" size="md" fixedWidth />
                        </ListItemIcon>
                        <ListItemText primary="Upload your metadata file to enable SAML"></ListItemText>
                      </ListItem>
                      <ListItem dense>
                        <ListItemIcon />
                        <FileUpload onUpload={metadata => setForm({ ...form, metadata })} />
                      </ListItem>
                    </>
                  ) : (
                    <ListItem dense>
                      <ListItemIcon></ListItemIcon>
                      <Box marginRight={4}>
                        <TextField
                          required
                          fullWidth
                          label="Issuer"
                          value={form.issuer || ''}
                          variant="filled"
                          onChange={event => setForm({ ...form, issuer: event.target.value })}
                        />
                        <TextField
                          required
                          fullWidth
                          label="Client ID"
                          value={form.clientId || ''}
                          variant="filled"
                          onChange={event => setForm({ ...form, clientId: event.target.value })}
                        />
                        <TextField
                          required
                          fullWidth
                          label="Client Secret"
                          value={form.clientSecret || ''}
                          variant="filled"
                          onChange={event => setForm({ ...form, clientSecret: event.target.value })}
                        />
                      </Box>
                    </ListItem>
                  )}
                  <ListItem dense>
                    <ListItemIcon />
                    <Box>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={incomplete || updating}
                        onClick={enable}
                        size="small"
                      >
                        {updating ? 'Updating...' : 'Enable'}
                      </Button>
                      &nbsp; &nbsp;
                      <Typography variant="caption" gutterBottom>
                        Setup
                        <Link href="https://link.remote.it/support/setup-domain">Instructions.</Link>
                      </Typography>
                    </Box>
                  </ListItem>
                </>
              )
            ) : (
              <ListItem>
                <Notice severity="info" gutterTop>
                  Validate your domain name to use an Identity Provider
                  <em>SAML and ODIC are both supported</em>
                </Notice>
              </ListItem>
            )}
          </List>
        </>
      )}
    </Container>
  )
}
