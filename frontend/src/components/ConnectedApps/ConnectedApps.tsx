import React, { useEffect } from 'react'
import { List, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../../store'
import { AuthorizedAgentCard } from './AuthorizedAgentCard'
import { Gutters } from '../Gutters'
import { Notice } from '../Notice'
import { Icon } from '../Icon'

export const ConnectedApps: React.FC = () => {
  const { agents, fetching, init } = useSelector((state: State) => state.agents)
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    dispatch.agents.init()
  }, [])

  return (
    <>
      <Typography variant="subtitle1">Authorized apps &amp; agents</Typography>
      <Gutters bottom={null}>
        <Typography variant="body2" gutterBottom>
          Apps and AI agents (like Claude) that you have signed in to your Remote.It account. Revoke
          an app to sign it out immediately, or limit which of your devices it can reach.
        </Typography>
      </Gutters>
      {fetching && !agents.length && (
        <Gutters>
          <Typography variant="body2" color="textSecondary">
            <Icon name="spinner-third" spin inlineLeft /> Loading…
          </Typography>
        </Gutters>
      )}
      {init && !fetching && !agents.length && (
        <Gutters>
          <Notice severity="info" fullWidth>
            You have not authorized any apps yet.
          </Notice>
        </Gutters>
      )}
      <List>
        {agents.map(agent => (
          <AuthorizedAgentCard key={agent.clientId} agent={agent} />
        ))}
      </List>
    </>
  )
}
