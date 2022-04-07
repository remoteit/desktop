import React, { useEffect, useState } from 'react'
import { REGEX_DOMAIN_SAFE } from '../shared/constants'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import {
  Typography,
  Button,
  Chip,
  Box,
  Divider,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@material-ui/core'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { FileUpload } from '../components/FileUpload'
import { Container } from '../components/Container'
import { DataCopy } from '../components/DataCopy'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationSettingsPage: React.FC = () => {
  const { updating, domain, defaultDomain, samlOnly, org } = useSelector((state: ApplicationState) => ({
    updating: state.organization.updating,
    domain: state.organization.domain || '',
    defaultDomain: state.auth.user?.email.split('@')[1],
    samlOnly: !!state.organization.providers?.includes('SAML'),
    org: state.organization,
  }))
  const [form, setForm] = useState<{ samlEnabled?: boolean; metadata?: string }>({
    samlEnabled: org.samlEnabled,
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

  return (
    <Container
      bodyProps={{ inset: false }}
      header={
        <Typography variant="h1">
          <Title>Organization Settings</Title>
        </Typography>
      }
    >
      <Typography variant="subtitle1">General</Typography>
      <List>
        <InlineTextFieldSetting
          icon="at"
          label="Domain"
          value={(domain || defaultDomain)?.toString()}
          displayValue={domain.toString()}
          resetValue={defaultDomain}
          filter={REGEX_DOMAIN_SAFE}
          onSave={value => dispatch.organization.setOrganization({ domain: value.toString() })}
        />
        {domain &&
          (org.verified ? (
            <ListItem>
              <ListItemIcon />
              <ListItemText
                primary={
                  <Chip label="Verified" color="secondary" icon={<Icon name="check" size="sm" fixedWidth inline />} />
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
                  value={org.verificationCNAME}
                  label="Verification CNAME"
                  showBackground
                  fullWidth
                  gutterBottom
                />
                <DataCopy value={org.verificationValue} label="Verification Value" showBackground fullWidth />
              </Box>
            </ListItem>
          ))}
        <ListItemSetting
          toggle={org.require2FA}
          label="Require 2FA"
          subLabel="All organization members will be required to use Two Factor Authentication."
          disabled={samlOnly && org.verified}
          onClick={() => dispatch.organization.setOrganization({ require2FA: !org.require2FA })}
          icon="lock"
        />
        <ListItemSetting
          toggle={samlOnly}
          label="Require SAML"
          subLabel="All organization members will not be able to login with email/password or Google."
          disabled={org.require2FA || !org.verified}
          onClick={() => dispatch.organization.setOrganization({ providers: samlOnly ? null : ['SAML'] })}
          icon="shield"
        />
      </List>
      <Divider variant="inset" />
      <Typography variant="subtitle1">SAML Configuration</Typography>
      <List>
        {org.verified ? (
          org.samlEnabled ? (
            <>
              <ListItem>
                <ListItemIcon>
                  <Icon name="sign-in" size="md" fixedWidth />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Chip label="Enabled" color="secondary" icon={<Icon name="shield" size="sm" fixedWidth inline />} />
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
    </Container>
  )
}
