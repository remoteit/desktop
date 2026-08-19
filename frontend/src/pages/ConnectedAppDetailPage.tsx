import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import { Chip, List, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../store'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { FormDisplay } from '../components/FormDisplay'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Icon } from '../components/Icon'
import { Timestamp } from '../components/Timestamp'
import { AgentAvatar } from '../components/ConnectedApps/AgentAvatar'
import { AgentReachEditor } from '../components/ConnectedApps/AgentReachEditor'
import { capabilityLabel, accessWindow } from '../components/ConnectedApps/helpers'
import { spacing } from '../styling'

export const ConnectedAppDetailPage: React.FC = () => {
  const { t } = useTranslation()
  const { clientId } = useParams<{ clientId: string }>()
  const decoded = decodeURIComponent(clientId)
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  const agent = useSelector((state: State) => state.agents.agents.find(a => a.clientId === decoded))
  const ttl = useSelector((state: State) => state.agents.accessTokenTtlSeconds)
  const fetching = useSelector((state: State) => state.agents.fetching)
  const init = useSelector((state: State) => state.agents.init)
  const revoking = useSelector((state: State) => state.agents.updating === decoded)

  useEffect(() => {
    dispatch.agents.init()
  }, [])

  const back = () => history.push('/account/connected')

  if (!agent) {
    return (
      <Container
        gutterBottom
        header={
          <Typography variant="h1">
            <Title>{t('connectedAppDetailPage.title', 'Connected App')}</Title>
          </Typography>
        }
      >
        <Gutters>
          {fetching || !init ? (
            <Typography variant="body2" color="textSecondary">
              <Icon name="spinner-third" spin inlineLeft /> {t('common.loadingEllipsis', 'Loading…')}
            </Typography>
          ) : (
            <Notice severity="info" fullWidth>
              {t('connectedAppDetailPage.noLongerAuthorized', 'This app is no longer authorized.')}
            </Notice>
          )}
        </Gutters>
      </Container>
    )
  }

  const name = agent.clientName || agent.clientId

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>
            <AgentAvatar agent={agent} size={spacing.xl} inline />
            {name}
          </Title>
          <ConfirmIconButton
            confirm
            icon="trash"
            size="md"
            title={t('connectedAppDetailPage.revokeAccess', 'Revoke access')}
            color={revoking ? 'danger' : undefined}
            loading={revoking}
            disabled={revoking}
            confirmProps={{
              title: t('connectedAppDetailPage.revokeAccessConfirmTitle', 'Revoke access?'),
              action: t('connectedAppDetailPage.revoke', 'Revoke'),
              color: 'error',
              children: (
                <>
                  <Notice severity="error" gutterBottom fullWidth>
                    <b>{name}</b> {t('connectedAppDetailPage.signOutBefore', 'will be signed out. New access is blocked immediately; any session already in progress ends within')}{' '}
                    <b>{accessWindow(ttl)}</b>.
                  </Notice>
                  <Typography variant="body2">
                    {t('connectedAppDetailPage.requestAgain', 'It can request access again by signing in.')}
                  </Typography>
                </>
              ),
            }}
            onClick={async () => {
              await dispatch.agents.revoke(agent.clientId)
              back()
            }}
          />
        </Typography>
      }
    >
      <Typography variant="subtitle1">{t('connectedAppDetailPage.permissions', 'Permissions')}</Typography>
      <Gutters top={null}>
        {agent.capabilities.length ? (
          <>
            <Typography variant="caption" display="block" sx={{ marginBottom: 1.5 }}>
              {t('connectedAppDetailPage.grantedWhenSignedIn', {
                name,
                defaultValue: 'Granted when {{name}} signed in. To change them, revoke access and have it sign in again.',
              })}
            </Typography>
            {agent.capabilities.map(scope => (
              <Chip key={scope} size="small" label={capabilityLabel(scope)} sx={{ mr: 1, mb: 0.5 }} />
            ))}
          </>
        ) : (
          <Typography variant="body2" color="textSecondary">
            {t(
              'connectedAppDetailPage.noDeviceAccess',
              'No device access — it can confirm your identity, but cannot see or control any devices.'
            )}
          </Typography>
        )}
      </Gutters>

      <Typography variant="subtitle1">{t('connectedAppDetailPage.details', 'Details')}</Typography>
      <List>
        {agent.audience.length > 0 && (
          <FormDisplay
            icon="cloud"
            label={t('connectedAppDetailPage.service', 'Service')}
            displayValue={agent.audience.map(a => (
              <span key={a.url} style={{ display: 'block' }}>
                {a.label}
                <Typography
                  variant="caption"
                  color="textSecondary"
                  component="span"
                  sx={{ display: 'block', wordBreak: 'break-all' }}
                >
                  {a.url}
                </Typography>
              </span>
            ))}
            displayOnly
          />
        )}
        {agent.grantedAt && (
          <FormDisplay
            icon="calendar-star"
            label={t('connectedAppDetailPage.authorized', 'Authorized')}
            displayValue={<Timestamp date={new Date(agent.grantedAt)} variant="long" />}
            displayOnly
          />
        )}
        <FormDisplay
          icon="clock"
          label={t('connectedAppDetailPage.lastActive', 'Last active')}
          displayValue={
            agent.lastActive ? (
              <Timestamp date={new Date(agent.lastActive)} variant="long" />
            ) : (
              t('connectedAppDetailPage.noActivityYet', 'No activity yet')
            )
          }
          displayOnly
        />
      </List>

      <Typography variant="subtitle1">{t('connectedAppDetailPage.deviceAccess', 'Device access')}</Typography>
      <AgentReachEditor agent={agent} />
    </Container>
  )
}
