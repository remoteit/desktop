import React, { useEffect } from 'react'
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
  const { clientId } = useParams<{ clientId: string }>()
  const decoded = decodeURIComponent(clientId)
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  const agent = useSelector((state: State) => state.agents.agents.find(a => a.clientId === decoded))
  const ttl = useSelector((state: State) => state.agents.accessTokenTtlSeconds)
  const fetching = useSelector((state: State) => state.agents.fetching)
  const init = useSelector((state: State) => state.agents.init)
  const updating = useSelector((state: State) => state.agents.updating)

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
            <Title>Connected App</Title>
          </Typography>
        }
      >
        <Gutters>
          {fetching || !init ? (
            <Typography variant="body2" color="textSecondary">
              <Icon name="spinner-third" spin inlineLeft /> Loading…
            </Typography>
          ) : (
            <Notice severity="info" fullWidth>
              This app is no longer authorized.
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
            <AgentAvatar agent={agent} size={spacing.lg} inline />
            {name}
          </Title>
          <ConfirmIconButton
            confirm
            icon="trash"
            size="md"
            title="Revoke access"
            loading={updating === agent.clientId}
            disabled={updating === agent.clientId}
            confirmProps={{
              title: 'Revoke access?',
              action: 'Revoke',
              color: 'error',
              children: (
                <Notice severity="warning" fullWidth gutterBottom>
                  <b>{name}</b> will be signed out. New access is blocked immediately; any session already in progress
                  ends within <b>{accessWindow(ttl)}</b>. It can request access again by signing in.
                </Notice>
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
      <Typography variant="subtitle1">Permissions</Typography>
      <Gutters top={null}>
        {agent.capabilities.length ? (
          agent.capabilities.map(scope => (
            <Chip key={scope} size="small" label={capabilityLabel(scope)} sx={{ mr: 1, mb: 0.5 }} />
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            No device access — it can confirm your identity, but cannot see or control any devices.
          </Typography>
        )}
      </Gutters>

      <Typography variant="subtitle1">Details</Typography>
      <List>
        {agent.audience.length > 0 && (
          <FormDisplay
            icon="cloud"
            label="Service"
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
            label="Authorized"
            displayValue={<Timestamp date={new Date(agent.grantedAt)} variant="long" />}
            displayOnly
          />
        )}
        <FormDisplay
          icon="clock"
          label="Last active"
          displayValue={
            agent.lastActive ? <Timestamp date={new Date(agent.lastActive)} variant="long" /> : 'No activity yet'
          }
          displayOnly
        />
      </List>

      <Typography variant="subtitle1">Device reach</Typography>
      <AgentReachEditor agent={agent} />
    </Container>
  )
}
