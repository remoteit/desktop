import React from 'react'
import { Icon } from '../Icon'
import { Title } from '../Title'
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

  return (
    <List>
      {!!sessions.length && (
        <Typography variant="subtitle1">
          <Title>Connected users</Title>
          <RefreshButton />
        </Typography>
      )}
      {sessions.map(s => (
        <ListItem key={s.service.id + s.user.email} dense>
          <ListItemIcon>
            <InitiatorPlatform id={s.user.platform} connected={true} />
          </ListItemIcon>
          <ListItemText
            classes={{ primary: css.title }}
            primary={
              <>
                <Title>{s.user.email}</Title>
                <Icon name="long-arrow-right" color="primary" size="lg" inline inlineLeft fixedWidth />
                <ServiceName device={s.device} service={s.service} />
              </>
            }
            secondary={<Duration startTime={s.user.timestamp?.getTime()} ago />}
          />
        </ListItem>
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  title: { display: 'flex', alignItems: 'flex-end' },
})
