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
  other?: boolean
  recent?: boolean
}

export const SessionListItem: React.FC<Props> = ({ session, other, recent }) => {
  const css = useStyles()
  const pathname = other
    ? `/devices/${session.target.deviceId}/${session.target.id}/users/${session.user?.email}`
    : `/connections/${session.target.id}`

  if (!session) return null

  return (
    <ListItemLocation pathname={pathname} dense>
      <ListItemIcon>
        <InitiatorPlatform id={session.platform} connected={!recent} />
      </ListItemIcon>
      <ListItemText
        classes={{ primary: css.title }}
        primary={
          <>
            <span className={css.from}>
              <Title>
                {session.user?.email}
                {/* {session.id} */}
              </Title>
              {/* <Typography variant="caption" display="block">
                <LocationPin session={session} />
                <Duration startTime={session.timestamp?.getTime()} ago />
              </Typography> */}
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
    '& > span': { overflow: 'hidden' },
    '& > svg': { marginTop: spacing.xs, marginRight: spacing.lg, marginLeft: spacing.lg },
  },
  from: { width: '30%' },
})
