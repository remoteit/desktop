import React from 'react'
import { makeStyles, Typography, ListItemText, ListItemIcon } from '@material-ui/core'
import { InitiatorPlatform } from './InitiatorPlatform'
import { ListItemLocation } from './ListItemLocation'
import { TargetPlatform } from './TargetPlatform'
import { LocationPin } from './LocationPin'
import { Duration } from './Duration'
import { Title } from './Title'
import { Icon } from './Icon'
import { spacing } from '../styling'

export interface Props {
  session: ISession
}

export const SessionListItem: React.FC<Props> = ({ session }) => {
  const css = useStyles()

  if (!session) return null
  console.log('SESSION', session.target.name, session.platform, session.target.platform)

  return (
    <ListItemLocation pathname={`/connections/${session.target.id}`} dense>
      <ListItemIcon>
        <InitiatorPlatform id={session.platform} connected={true} />
      </ListItemIcon>
      <ListItemText
        classes={{ primary: css.title }}
        primary={
          <>
            <span>
              <Title>{session.user?.email}</Title>
              <Typography variant="caption" display="block">
                <LocationPin session={session} />
                <Duration startTime={session.timestamp?.getTime()} ago />
              </Typography>
            </span>
            <Icon name="arrow-right" color="primary" size="md" type="regular" fixedWidth />
            <Title>
              {session.target.name}
              <sup>
                <TargetPlatform id={session.target.platform} tooltip />
              </sup>
            </Title>
          </>
        }
      />
    </ListItemLocation>
  )
}

const useStyles = makeStyles({
  title: {
    display: 'flex',
    alignItems: 'flex-start',
    '& > span': { width: '50%' },
    '& > svg': { marginTop: spacing.xs, marginRight: spacing.lg, marginLeft: spacing.lg },
  },
})
