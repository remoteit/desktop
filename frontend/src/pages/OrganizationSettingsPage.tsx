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
} from '@material-ui/core'
import { getActiveOrganizationMembership, getActiveOrganizationPermissions } from '../models/accounts'
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
  const { updating, domain, defaultDomain, samlOnly, thisOrg, org, permissions } = useSelector(
    (state: ApplicationState) => {
      const membership = getActiveOrganizationMembership(state)
      return {
        updating: state.organization.updating,
        domain: state.organization.domain || '',
        defaultDomain: state.auth.user?.email.split('@')[1],
        samlOnly: !!state.organization.providers?.includes('SAML'),
        thisOrg: state.organization,
        org: membership?.organization || state.organization,
        permissions: getActiveOrganizationPermissions(state),
      }
    }
  )
  const [removing, setRemoving] = useState<boolean>(false)
  const [form, setForm] = useState<{ samlEnabled?: boolean; metadata?: string }>({
    samlEnabled: thisOrg.samlEnabled,
    metadata: '',
  })
  const dispatch = useDispatch<Dispatch>()
  const isThisOrg = thisOrg.id === org.id

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
          <DeleteButton
            title="Delete Organization"
            destroying={removing}
            warning={
              <>
                <Notice severity="danger" fullWidth gutterBottom>
                  You will be permanently deleting <i>{org.name}. </i>
                </Notice>
                This will remove all your members and their access to your devices.
              </>
            }
            onDelete={() => {
              setRemoving(true)
              dispatch.organization.removeOrganization()
            }}
          />
        </Typography>
      }
    >
      <Typography variant="subtitle1">General</Typography>
      <List>
        <InlineTextFieldSetting
          hideIcon
          value={org.name}
          label="Organization Name"
          resetValue={org.name}
          onSave={name => dispatch.organization.setOrganization({ name: name.toString() })}
        />
      </List>
      {isThisOrg && (
        <>
          <Typography variant="subtitle1">Authentication</Typography>
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
            {domain &&
              (thisOrg.verified ? (
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
                      value={thisOrg.verificationCNAME}
                      label="Verification CNAME"
                      showBackground
                      fullWidth
                      gutterBottom
                    />
                    <DataCopy value={thisOrg.verificationValue} label="Verification Value" showBackground fullWidth />
                  </Box>
                </ListItem>
              ))}
            <ListItemSetting
              toggle={thisOrg.require2FA}
              label="Require 2FA"
              subLabel="All organization members will be required to use Two Factor Authentication."
              disabled={samlOnly && thisOrg.verified}
              onClick={() => dispatch.organization.setOrganization({ require2FA: !thisOrg.require2FA })}
              icon="lock"
            />
            <ListItemSetting
              toggle={samlOnly}
              label="Require SAML"
              subLabel="All organization members will not be able to login with email/password or Google."
              disabled={thisOrg.require2FA || !thisOrg.verified}
              onClick={() => dispatch.organization.setOrganization({ providers: samlOnly ? null : ['SAML'] })}
              icon="shield"
            />
          </List>
          <Typography variant="subtitle1">SAML Configuration</Typography>
          <List>
            {thisOrg.verified ? (
              thisOrg.samlEnabled ? (
                <>
                  <ListItem>
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
                      <Button variant="contained" color="default" disabled={updating} onClick={disable} size="small">
                        {updating ? 'Updating...' : 'Disable'}
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
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
                  <ListItem>
                    <ListItemIcon />
                    <FileUpload onUpload={metadata => setForm({ ...form, metadata })} />
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
  )
}
