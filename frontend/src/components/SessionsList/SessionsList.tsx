import React from 'react'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { useHistory } from 'react-router-dom'
import { Duration } from '../Duration'
import { ServiceName } from '../ServiceName'
import { RefreshButton } from '../../buttons/RefreshButton'
import { InitiatorPlatform } from '../InitiatorPlatform'
import { makeStyles, Typography, List, ListItem, ListItemText, ListItemIcon } from '@material-ui/core'

export interface Props {
  sessions: ISession[]
}

export const SessionsList: React.FC<Props> = ({ sessions }) => {
  const css = useStyles()
  const history = useHistory()

  if (!sessions.length) return null

  return (
    <List>
      {!!sessions.length && (
        <Typography variant="subtitle1">
          <Title>Connected users</Title>
          <RefreshButton />
        </Typography>
      )}
      {sessions.map((s, i) => (
        <ListItem
          key={i}
          onClick={() => history.push(`/connections/${s.service.id}/users/${s.user.email}`)}
          button
          dense
        >
          <ListItemIcon>
            <InitiatorPlatform id={s.user.platform} connected={true} />
          </ListItemIcon>
          <ListItemText
            classes={{ primary: css.title }}
            primary={
              <>
                <span>
                  <Title>{s.user.email}</Title>
                  <Typography variant="caption" display="block">
                    <Duration startTime={s.user.timestamp?.getTime()} ago />
                  </Typography>
                </span>
                <Icon name="long-arrow-right" color="primary" size="lg" inline inlineLeft fixedWidth />
                <ServiceName device={s.device} service={s.service} />
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  title: {
    display: 'flex',
    alignItems: 'flex-end',
    '& > span': { width: '50%' },
  },
})
