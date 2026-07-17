import React, { useEffect } from 'react'
import { List, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../../store'
import { AgentListItem } from './AgentListItem'
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
      <Typography variant="subtitle1">Apps &amp; AI agents</Typography>
      {agents.length ? (
        <List>
          {agents.map(agent => (
            <AgentListItem key={agent.clientId} agent={agent} />
          ))}
        </List>
      ) : init && !fetching ? (
        <Gutters top={null}>
          <Notice severity="info" fullWidth>
            You have not authorized any apps yet.
          </Notice>
        </Gutters>
      ) : (
        <Gutters top={null}>
          <Typography variant="body2" color="textSecondary">
            <Icon name="spinner-third" spin inlineLeft /> Loading…
          </Typography>
        </Gutters>
      )}
    </>
  )
}
