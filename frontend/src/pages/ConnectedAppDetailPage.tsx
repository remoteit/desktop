import React, { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Avatar, Box, Button, Chip, Divider, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../store'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Icon } from '../components/Icon'
import { Timestamp } from '../components/Timestamp'
import { RevokeAgentDialog } from '../components/ConnectedApps/RevokeAgentDialog'
import { AgentReachDialog } from '../components/ConnectedApps/AgentReachDialog'
import { capabilityLabel, useAccountLabel } from '../components/ConnectedApps/helpers'

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box mb={3}>
    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
      {label}
    </Typography>
    {children}
  </Box>
)

export const ConnectedAppDetailPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>()
  const decoded = decodeURIComponent(clientId)
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [reachOpen, setReachOpen] = useState(false)

  const agent = useSelector((state: State) => state.agents.agents.find(a => a.clientId === decoded))
  const ttl = useSelector((state: State) => state.agents.accessTokenTtlSeconds)
  const fetching = useSelector((state: State) => state.agents.fetching)
  const init = useSelector((state: State) => state.agents.init)
  const accountLabel = useAccountLabel()

  useEffect(() => {
    dispatch.agents.init()
  }, [])

  const header = (title: string) => (
    <Typography variant="h1">
      <IconButton name="chevron-left" onClick={() => history.push('/account/connected')} size="md" title="Back" />
      <Title>{title}</Title>
    </Typography>
  )

  if (!agent) {
    return (
      <Container gutterBottom header={header('Connected App')}>
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
  const monogram = (name.trim()[0] || '?').toUpperCase()
  const mins = Math.max(1, Math.round(ttl / 60))

  return (
    <Container gutterBottom header={header(name)}>
      <Gutters>
        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
          <Avatar src={agent.logoUri} alt="">
            {monogram}
          </Avatar>
          <Box>
            <Typography variant="h3">{name}</Typography>
            {agent.grantedAt && (
              <Typography variant="caption" color="textSecondary" display="block">
                Authorized <Timestamp date={new Date(agent.grantedAt)} variant="long" />
              </Typography>
            )}
            <Typography variant="caption" color="textSecondary" display="block">
              {agent.lastActive ? (
                <>
                  Last active <Timestamp date={new Date(agent.lastActive)} variant="long" />
                </>
              ) : (
                'No activity recorded yet'
              )}
            </Typography>
          </Box>
        </Stack>

        <Section label="Can do">
          {agent.capabilities.length ? (
            agent.capabilities.map(scope => (
              <Chip key={scope} size="small" label={capabilityLabel(scope)} sx={{ mr: 0.5, mb: 0.5 }} />
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              No device access — it can confirm your identity, but cannot see or control any devices.
            </Typography>
          )}
        </Section>

        <Section label="Can access">
          {agent.audience.length ? (
            <List dense disablePadding>
              {agent.audience.map(a => (
                <ListItem key={a.url} disableGutters>
                  <ListItemText
                    primary={a.label}
                    secondary={a.url}
                    secondaryTypographyProps={{ sx: { wordBreak: 'break-all' } }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              —
            </Typography>
          )}
        </Section>

        <Section label="Device reach">
          {agent.reach?.accounts == null ? (
            <Typography variant="body2" gutterBottom>
              Can reach all your devices.
            </Typography>
          ) : (
            agent.reach.accounts.map(rule => (
              <Box key={rule.account} mb={1.5}>
                <Typography variant="body2">
                  <b>{accountLabel(rule.account)}</b>
                </Typography>
                {rule.tags?.length ? (
                  <Box mt={0.5}>
                    <Typography variant="caption" color="textSecondary">
                      devices tagged ({rule.operator === 'ALL' ? 'all of' : 'any of'}):{' '}
                    </Typography>
                    {rule.tags.map(tag => (
                      <Chip key={tag} size="small" variant="outlined" label={tag} sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="textSecondary">
                    all devices
                  </Typography>
                )}
              </Box>
            ))
          )}
          <Button size="small" onClick={() => setReachOpen(true)} sx={{ mt: 1 }}>
            Change device limits
          </Button>
        </Section>

        <Divider sx={{ my: 2 }} />

        <Section label="Revoke access">
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Signs {name} out. New access is blocked immediately; any in-progress session ends within {mins} minute
            {mins === 1 ? '' : 's'}. It can request access again by signing in.
          </Typography>
          <RevokeAgentDialog agent={agent} onRevoked={() => history.push('/account/connected')} />
        </Section>
      </Gutters>
      <AgentReachDialog agent={agent} open={reachOpen} onClose={() => setReachOpen(false)} />
    </Container>
  )
}
