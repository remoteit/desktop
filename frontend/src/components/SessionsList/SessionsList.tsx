import React from 'react'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { Duration } from '../Duration'
import { useHistory } from 'react-router-dom'
import { LocationPin } from '../LocationPin'
import { TargetPlatform } from '../TargetPlatform'
import { RefreshButton } from '../../buttons/RefreshButton'
import { SessionListItem } from '../SessionListItem'
import { InitiatorPlatform } from '../InitiatorPlatform'
import { makeStyles, Typography, List, ListItem, ListItemText, ListItemIcon } from '@material-ui/core'

export interface Props {
  sessions: ISession[]
  title: string
  action?: React.ReactElement
}

export const SessionsList: React.FC<Props> = ({ sessions, title, action }) => {
  if (!sessions.length) return null

  return (
    <>
      <Typography variant="subtitle1">
        <Title>{title}</Title>
        {action}
      </Typography>
      {sessions.map((s, i) => (
        <SessionListItem session={s} key={i} />
      ))}
    </>
  )
}
