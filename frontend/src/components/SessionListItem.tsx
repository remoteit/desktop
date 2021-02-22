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
  recent?: boolean
}

export const SessionListItem: React.FC<Props> = ({ session, recent }) => {
  const css = useStyles()

  if (!session) return null

  return (
    <ListItemLocation pathname={`/connections/${session.target.id}`} dense>
      <ListItemIcon>
        <InitiatorPlatform id={session.platform} connected={!recent} />
      </ListItemIcon>
      <ListItemText
        classes={{ primary: css.title }}
        primary={
          <>
            <span>
              <Title>
                {session.user?.email}
                {/* {session.id} */}
              </Title>
              <Typography variant="caption" display="block">
                <LocationPin session={session} />
                <Duration startTime={session.timestamp?.getTime()} ago />
              </Typography>
            </span>
            <Icon name="arrow-right" color={recent ? 'gray' : 'primary'} size="md" type="regular" fixedWidth />
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
    '& > span': { width: '50%', overflow: 'hidden' },
    '& > svg': { marginTop: spacing.xs, marginRight: spacing.lg, marginLeft: spacing.lg },
  },
})
