import React, { useEffect } from 'react'
import { List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { State, Dispatch } from '../../store'
import { AgentListItem } from './AgentListItem'
import { Gutters } from '../Gutters'
import { Notice } from '../Notice'
import { Icon } from '../Icon'

export const ConnectedApps: React.FC = () => {
  const { agents, fetching, init } = useSelector((state: State) => state.agents)
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()

  useEffect(() => {
    dispatch.agents.init()
  }, [])

  return (
    <>
      <Typography variant="subtitle1">{t('connectedApps.title', 'Apps & AI agents')}</Typography>
      {agents.length ? (
        <List>
          {agents.map(agent => (
            <AgentListItem key={agent.clientId} agent={agent} />
          ))}
        </List>
      ) : init && !fetching ? (
        <Gutters top={null}>
          <Notice severity="info" fullWidth>
            {t('connectedApps.empty', 'You have not authorized any apps yet.')}
          </Notice>
        </Gutters>
      ) : (
        // Match the first agent row's layout so the content doesn't jump when it loads in.
        <List>
          <ListItem dense>
            <ListItemIcon>
              <Icon name="spinner-third" spin size="lg" color="grayDark" />
            </ListItemIcon>
            <ListItemText primary={t('connectedApps.loading', 'Loading…')} primaryTypographyProps={{ color: 'textSecondary' }} />
          </ListItem>
        </List>
      )}
    </>
  )
}
