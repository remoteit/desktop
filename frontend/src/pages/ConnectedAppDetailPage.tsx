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
import { enabledActions, revokeWindow } from '../components/ConnectedApps/helpers'
import { spacing } from '../styling'

export const ConnectedAppDetailPage: React.FC = () => {
  const { t } = useTranslation()
  const { clientId } = useParams<{ clientId: string }>()
  const decoded = decodeURIComponent(clientId)
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  const agent = useSelector((state: State) => state.agents.agents.find(a => a.clientId === decoded))
  const fetching = useSelector((state: State) => state.agents.fetching)
  const init = useSelector((state: State) => state.agents.init)
  const revoking = useSelector((state: State) => state.agents.updating === agent?.id)

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

  const name = agent.app || agent.clientId
  const actions = enabledActions(agent)
  const reach = agent.revokeReach

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
                    <b>{name}</b>{' '}
                    {t('connectedAppDetailPage.signOutBefore', 'will be signed out and can no longer get new access.')}
                    {reach?.delayed?.length ? (
                      <>
                        {' '}
                        {t('connectedAppDetailPage.delayedReach', {
                          apis: reach.delayed.join(', '),
                          window: revokeWindow(reach.delayMinutes),
                          defaultValue: 'Access already in progress at {{apis}} ends within {{window}}.',
                        })}
                      </>
                    ) : null}
                  </Notice>
                  <Typography variant="body2">
                    {t('connectedAppDetailPage.requestAgain', 'It can request access again by signing in.')}
                  </Typography>
                </>
              ),
            }}
            onClick={async () => {
              await dispatch.agents.revoke(agent.id)
              back()
            }}
          />
        </Typography>
      }
    >
      <Typography variant="subtitle1">{t('connectedAppDetailPage.permissions', 'Permissions')}</Typography>
      <Gutters top={null}>
        {actions.length ? (
          <>
            <Typography variant="caption" display="block" sx={{ marginBottom: 1.5 }}>
              {t('connectedAppDetailPage.grantedWhenSignedIn', {
                name,
                defaultValue: 'Granted when {{name}} signed in. Manage or trim them from your account page.',
              })}
            </Typography>
            {actions.map(action => (
              <Chip
                key={action.key}
                size="small"
                label={action.limit ? `${action.label} (${action.limit})` : action.label}
                title={action.description || undefined}
                sx={{ mr: 1, mb: 0.5 }}
              />
            ))}
          </>
        ) : (
          <Typography variant="body2" color="textSecondary">
            {t(
              'connectedAppDetailPage.signInOnly',
              'Sign-in only — it can confirm your identity, but was granted nothing else.'
            )}
          </Typography>
        )}
      </Gutters>

      <Typography variant="subtitle1">{t('connectedAppDetailPage.details', 'Details')}</Typography>
      <List>
        {agent.givenAt && (
          <FormDisplay
            icon="calendar-star"
            label={t('connectedAppDetailPage.authorized', 'Authorized')}
            displayValue={<Timestamp date={new Date(agent.givenAt)} variant="long" />}
            displayOnly
          />
        )}
        <FormDisplay
          icon="clock"
          label={t('connectedAppDetailPage.lastUsed', 'Last used')}
          displayValue={
            agent.lastUsedAt ? (
              <Timestamp date={new Date(agent.lastUsedAt)} variant="long" />
            ) : (
              t('connectedAppDetailPage.noActivityYet', 'No activity yet')
            )
          }
          displayOnly
        />
        {agent.links?.map(link => (
          <FormDisplay
            key={link.url}
            icon="arrow-up-right-from-square"
            label={link.name}
            displayValue={
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.url}
              </a>
            }
            displayOnly
          />
        ))}
      </List>
    </Container>
  )
}
