import React, { useEffect, useState } from 'react'
import { Redirect } from 'react-router-dom'
import { REGEX_DOMAIN_SAFE } from '../shared/constants'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import {
  Typography,
  Button,
  Chip,
  Box,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'
import { getMembership } from '../models/accounts'
import { memberOrganization, selectPermissions, selectLimitsLookup } from '../models/organization'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { DeleteButton } from '../buttons/DeleteButton'
import { FileUpload } from '../components/FileUpload'
import { Container } from '../components/Container'
import { DataCopy } from '../components/DataCopy'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationSettingsPage: React.FC = () => {
  const { updating, domain, defaultDomain, samlOnly, isThisOrg, organization, limits, permissions } = useSelector(
    (state: ApplicationState) => {
      const membership = getMembership(state)
      const organization = memberOrganization(state.organization.all, membership.account.id)
      return {
        organization,
        isThisOrg: organization.id === state.auth.user?.id,
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
  const [form, setForm] = useState<{ samlEnabled?: boolean; metadata?: string }>({
    samlEnabled: organization.samlEnabled,
    metadata: '',
  })
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    analyticsHelper.page('OrganizationSAMLPage')
  }, [])

  const enable = () => {
    if (!form.metadata) return
    dispatch.organization.setSAML({ enabled: true, metadata: form.metadata })
  }

  const disable = () => {
    dispatch.organization.setSAML({ enabled: false })
  }

  if (!permissions?.includes('ADMIN')) return <Redirect to={'/organization'} />

  return (
    <Container
      bodyProps={{ inset: false }}
      header={
        <Typography variant="h1">
          <Title>Settings</Title>
          {isThisOrg && (
            <DeleteButton
              title="Delete Organization"
              warning={
                <>
                  <Notice severity="danger" fullWidth gutterBottom>
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
      {isThisOrg && limits.saml && (
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
                      <Chip
                        label="Verified"
                        color="secondary"
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
                      <Link href="https://link.remote.it/support/setup-domain" target="_blank">
                        Instructions.
                      </Link>
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
                  <Link href="https://link.remote.it/support/setup-domain" target="_blank">
                    Instructions.
                  </Link>
                </Typography>
              </ListItem>
            )}
          </List>
          <Typography variant="subtitle1">SAML Configuration</Typography>
          <List>
            {organization.verified ? (
              organization.samlEnabled ? (
                <>
                  <ListItem dense>
                    <ListItemIcon>
                      <Icon name="sign-in" size="md" fixedWidth />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Chip
                          label="Enabled"
                          color="secondary"
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
                    label="Require SAML"
                    subLabel="All organization members will not be able to login with email/password or Google."
                    disabled={!organization.verified}
                    onClick={() => dispatch.organization.setOrganization({ providers: samlOnly ? null : ['SAML'] })}
                    icon="shield-alt"
                  />
                </>
              ) : (
                <>
                  <ListItem dense>
                    <ListItemIcon>
                      <Icon name="sign-in" size="md" fixedWidth />
                    </ListItemIcon>
                    <ListItemText primary="Upload your metadata file to enable SAML"></ListItemText>
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={!form.metadata || updating}
                        onClick={enable}
                        size="small"
                      >
                        {updating ? 'Updating...' : 'Enable'}
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem dense>
                    <ListItemIcon />
                    <FileUpload onUpload={metadata => setForm({ ...form, metadata })} />
                  </ListItem>
                  <ListItem dense>
                    <ListItemIcon />
                    <Typography variant="caption" gutterBottom>
                      Setup
                      <Link href="https://link.remote.it/support/setup-domain" target="_blank">
                        Instructions.
                      </Link>
                    </Typography>
                  </ListItem>
                </>
              )
            ) : (
              <ListItem>
                <Notice severity="info" gutterTop>
                  Validate your domain name to enable SAML
                </Notice>
              </ListItem>
            )}
          </List>
        </>
      )}
    </Container>
  );
}
