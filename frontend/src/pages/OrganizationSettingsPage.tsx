import React from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { Button, Typography, List, ListSubheader } from '@mui/material'
import { selectPermissions, selectOrganization } from '../selectors/organizations'
import { selectMembership } from '../selectors/accounts'
import { OrganizationSAMLSettings } from '../components/OrganizationSAMLSettings'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ResellerSettings } from '../components/ResellerSettings'
import { DaemonSettingsList } from '../components/DaemonSettingsList'
import { AccountSlugSetting } from '../components/AccountSlugSetting'
import { TaggedIntoList } from '../components/TaggedIntoList'
import { DeleteButton } from '../buttons/DeleteButton'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { CloseOrganizationDialog } from '../components/CloseOrganizationDialog'
import { OrganizationContactSettings } from '../components/OrganizationContactSettings'
import type { PendingOrganizationClosure } from '../models/accounts'

export const OrganizationSettingsPage: React.FC = () => {
  const { t } = useTranslation()
  const organization = useSelector(selectOrganization)
  const permissions = useSelector(selectPermissions)
  const standalone = useSelector((state: State) => selectMembership(state).standalone)
  const isOrgOwner = useSelector((state: State) => organization.id === state.user.id)
  const dispatch = useDispatch<Dispatch>()
  const [closing, setClosing] = React.useState<PendingOrganizationClosure>()

  if (!permissions.includes('ADMIN'))
    return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container
      gutterBottom
      bodyProps={{ inset: false }}
      header={
        <Typography variant="h1">
          <Title>{t('organizationSettingsPage.settings', 'Settings')}</Title>
          {isOrgOwner && (
            <DeleteButton
              title={t('organizationSettingsPage.deleteOrganization', 'Delete Organization')}
              warning={
                <>
                  <Notice severity="error" fullWidth gutterBottom>
                    {t('organizationSettingsPage.permanentlyDeleting', 'You will be permanently deleting')}{' '}
                    <i>{organization.name}. </i>
                  </Notice>
                  {t(
                    'organizationSettingsPage.removeMembersWarning',
                    'This will remove all your members and their access to your devices.'
                  )}
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
        <ListSubheader>{t('organizationSettingsPage.general', 'General')}</ListSubheader>
        <InlineTextFieldSetting
          icon="industry-alt"
          value={organization.name}
          label={t('organizationSettingsPage.organizationName', 'Organization Name')}
          resetValue={organization.name}
          onSave={name => dispatch.organization.setOrganization({ name: name.toString() })}
        />
      </List>
      <OrganizationSAMLSettings />
      <AccountSlugSetting accountId={organization.id} />
      <DaemonSettingsList accountId={organization.id} />
      <TaggedIntoList accountId={organization.id} />
      {standalone && <OrganizationContactSettings key={organization.id} accountId={organization.id} />}
      {standalone && (
        <Button color="error" onClick={() => setClosing({ organizationId: organization.id, name: organization.name })}>
          {t('closeOrganization.submit', 'Close organization')}
        </Button>
      )}
      {closing && <CloseOrganizationDialog {...closing} onClose={() => setClosing(undefined)} />}
    </Container>
  )
}
