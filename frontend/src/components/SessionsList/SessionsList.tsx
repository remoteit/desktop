import React from 'react'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { Duration } from '../Duration'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ServiceName } from '../ServiceName'
import { TargetPlatform } from '../TargetPlatform'
import { RefreshButton } from '../../buttons/RefreshButton'
import { ApplicationState } from '../../store'
import { InitiatorPlatform } from '../InitiatorPlatform'
import { getAllDevices } from '../../models/accounts'
import { makeStyles, Typography, Tooltip, List, ListItem, ListItemText, ListItemIcon } from '@material-ui/core'

export interface Props {
  sessions: ISession[]
}

export const SessionsList: React.FC<Props> = ({ sessions }) => {
  const css = useStyles()
  const history = useHistory()

  if (!sessions.length) return null

  return (
    <List>
      <Typography variant="subtitle1">
        <Title>Connected users</Title>
        <RefreshButton />
      </Typography>
      {sessions.map((s, i) => (
        <ListItem
          key={i}
          onClick={() => history.push(`/connections/${s.target.id}/users/${s.user.email}`)}
          button
          dense
        >
          <ListItemIcon>
            <InitiatorPlatform id={s.platform} connected={true} />
          </ListItemIcon>
          <ListItemText
            classes={{ primary: css.title }}
            primary={
              <>
                <span>
                  <Title>{s.user.email}</Title>
                  <Typography variant="caption" display="block">
                    <Tooltip title={`${s.geo?.city}, ${s.geo?.stateName} - ${s.geo?.countryName}`}>
                      <span>
                        <Icon name="map-marker" type="regular" size="xs" inlineLeft />
                      </span>
                    </Tooltip>
                    <Duration startTime={s.timestamp?.getTime()} ago />
                  </Typography>
                </span>
                <Icon name="long-arrow-right" color="primary" size="lg" inline inlineLeft fixedWidth />
                <Title>
                  {s.target.name}
                  <sup>
                    <TargetPlatform id={s.target.platform} tooltip />
                  </sup>
                </Title>
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
