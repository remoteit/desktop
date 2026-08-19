import React, { useState } from 'react'
import { Redirect } from 'react-router-dom'
import { REGEX_DOMAIN_SAFE } from '../constants'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
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
import { useTranslation } from 'react-i18next'
import { selectPermissions, selectOrganization, selectLimitsLookup } from '../selectors/organizations'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { OrganizationSAMLUpload } from './OrganizationSAMLUpload'
import { ListItemSetting } from './ListItemSetting'
import { SelectSetting } from './SelectSetting'
import { ListItemCopy } from './ListItemCopy'
import { FormDisplay } from './FormDisplay'
import { ColorChip } from './ColorChip'
import { Notice } from './Notice'
import { Icon } from './Icon'
import { Link } from './Link'

export const OrganizationSAMLSettings: React.FC = () => {
  const organization = useSelector(selectOrganization)
  const updating = useSelector((state: State) => state.organization.updating)
  const defaultDomain = useSelector((state: State) => state.auth.user?.email.split('@')[1])
  const limits = useSelector(selectLimitsLookup)
  const permissions = useSelector(selectPermissions)
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()
  const [checking, setChecking] = useState<boolean>(false)
  const [form, setForm] = useState<IIdentityProviderSettings>({
    enabled: !!organization.identityProvider,
    type: (organization.identityProvider?.type as IOrganizationProvider) || 'SAML',
  })

  const domain = organization.domain || ''
  const required = !!organization.providers?.includes(form.type)

  const incomplete =
    (form.type === 'SAML' && !form.metadata) ||
    (form.type === 'OIDC' && !(form.clientId && form.clientSecret && form.issuer))

  const disable = () => dispatch.organization.setIdentityProvider({ type: form.type, enabled: false })

  const enable = () => {
    if (incomplete) return
    dispatch.organization.setIdentityProvider({ ...form, enabled: true })
  }

  React.useEffect(() => {
    setForm({ ...form, enabled: !!organization.identityProvider })
  }, [organization])

  if (!permissions.includes('ADMIN'))
    return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  if (!limits.saml) return null

  return (
    <>
      <List disablePadding>
        <InlineTextFieldSetting
          icon="globe-pointer"
          label={t('organizationSAMLSettings.domainLabel', 'Domain')}
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
            <ListItem dense>
              <ListItemIcon />
              <ListItemText
                primary={
                  <ColorChip
                    label={t('organizationSAMLSettings.verified', 'Verified')}
                    color="primary"
                    variant="contained"
                    icon={<Icon name="check" size="sm" fixedWidth inline />}
                  />
                }
              />
            </ListItem>
          ) : (
            <ListItem dense>
              <ListItemIcon />
              <Box display="flex" flexDirection="column">
                <Typography variant="caption" gutterBottom>
                  {t(
                    'organizationSAMLSettings.dnsInstructions',
                    'Add the following CNAME and Value to your DNS records to validate your domain:'
                  )}
                  <Link href="https://link.remote.it/support/setup-domain">
                    {t('organizationSAMLSettings.instructionsLink', 'Instructions.')}
                  </Link>
                </Typography>
                <ListItemCopy
                  value={organization.verificationCNAME}
                  label={t('organizationSAMLSettings.verificationCNAME', 'Verification CNAME')}
                  showBackground
                  fullWidth
                  gutterBottom
                />
                <ListItemCopy
                  value={organization.verificationValue}
                  label={t('organizationSAMLSettings.verificationValue', 'Verification Value')}
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
                    {checking
                      ? t('organizationSAMLSettings.checking', 'checking...')
                      : t('organizationSAMLSettings.checkDomain', 'Check domain')}
                  </Button>
                </Box>
              </Box>
            </ListItem>
          )
        ) : (
          <ListItem dense>
            <ListItemIcon />
            <Typography variant="caption" gutterBottom>
              {t('organizationSAMLSettings.enterDomain', "Enter your Organization's domain name.")}
              <Link href="https://link.remote.it/support/setup-domain">
                {t('organizationSAMLSettings.instructionsLink', 'Instructions.')}
              </Link>
            </Typography>
          </ListItem>
        )}
      </List>
      <Typography variant="subtitle1">{t('organizationSAMLSettings.identityProvider', 'Identity Provider')}</Typography>
      <List disablePadding>
        {organization.verified ? (
          organization.identityProvider ? (
            <>
              <ListItem dense>
                <ListItemIcon>{/* <Icon name="sign-in" size="md" fixedWidth /> */}</ListItemIcon>
                <ListItemText
                  primary={
                    <ColorChip
                      label={t('organizationSAMLSettings.providerEnabled', {
                        type: organization.identityProvider.type,
                        defaultValue: '{{type}} Enabled',
                      })}
                      color="primary"
                      variant="contained"
                      icon={<Icon name="shield" size="sm" fixedWidth inline />}
                    />
                  }
                />
                <ListItemSecondaryAction>
                  <Button variant="contained" disabled={updating} onClick={disable} size="small">
                    {updating ? t('organizationSAMLSettings.updating', 'Updating...') : t('common.disable', 'Disable')}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItemSetting
                toggle={required}
                label={t('organizationSAMLSettings.requireLogin', {
                  type: organization.identityProvider.type,
                  defaultValue: 'Require login with {{type}}',
                })}
                subLabel={t(
                  'organizationSAMLSettings.requireLoginSubLabel',
                  'All organization members will not be able to login with email/password or Google.'
                )}
                disabled={!organization.verified}
                onClick={() => dispatch.organization.setOrganization({ providers: required ? null : [form.type] })}
                icon="shield-alt"
              />
              <FormDisplay label={t('organizationSAMLSettings.issuerLabel', 'issuer')} value={organization.identityProvider.issuer} displayOnly hideEmpty />
              <FormDisplay label={t('organizationSAMLSettings.clientIdLabel', 'Client ID')} value={organization.identityProvider.clientId} displayOnly hideEmpty />
            </>
          ) : (
            <>
              <SelectSetting
                icon="sign-in"
                label={t('organizationSAMLSettings.providerTypeLabel', 'Provider type')}
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
                    <ListItemIcon />
                    <ListItemText
                      primary={t('organizationSAMLSettings.uploadMetadata', 'Upload your metadata file to enable SAML')}
                    ></ListItemText>
                  </ListItem>
                  <ListItem dense>
                    <ListItemIcon />
                    <OrganizationSAMLUpload onUpload={metadata => setForm({ ...form, metadata })} />
                  </ListItem>
                </>
              ) : (
                <ListItem dense>
                  <ListItemIcon></ListItemIcon>
                  <Box marginRight={4}>
                    <TextField
                      required
                      fullWidth
                      label={t('organizationSAMLSettings.issuerFieldLabel', 'Issuer')}
                      value={form.issuer || ''}
                      variant="filled"
                      onChange={event => setForm({ ...form, issuer: event.target.value })}
                    />
                    <TextField
                      required
                      fullWidth
                      label={t('organizationSAMLSettings.clientIdFieldLabel', 'Client ID')}
                      value={form.clientId || ''}
                      variant="filled"
                      onChange={event => setForm({ ...form, clientId: event.target.value })}
                    />
                    <TextField
                      required
                      fullWidth
                      label={t('organizationSAMLSettings.clientSecretFieldLabel', 'Client Secret')}
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
                  <Button variant="contained" color="primary" disabled={incomplete || updating} onClick={enable}>
                    {updating ? t('organizationSAMLSettings.updating', 'Updating...') : t('common.enable', 'Enable')}
                  </Button>
                  <Typography variant="caption" sx={{ marginLeft: 3 }} gutterBottom>
                    {t('organizationSAMLSettings.setup', 'Setup')}
                    <Link href="https://link.remote.it/support/setup-domain">
                      {t('organizationSAMLSettings.instructionsLink', 'Instructions.')}
                    </Link>
                  </Typography>
                </Box>
              </ListItem>
            </>
          )
        ) : (
          <ListItem dense>
            <Notice severity="info" gutterTop>
              {t('organizationSAMLSettings.validateDomainNotice', 'Validate your domain name to use an Identity Provider')}
              <em>{t('organizationSAMLSettings.samlOidcSupported', 'SAML and ODIC are both supported')}</em>
            </Notice>
          </ListItem>
        )}
      </List>
    </>
  )
}
