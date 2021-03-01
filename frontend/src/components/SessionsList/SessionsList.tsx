import React from 'react'
import { Title } from '../Title'
import { SessionListItem } from '../SessionListItem'
import { Typography } from '@material-ui/core'

export interface Props {
  sessions: ISession[]
  title: string
  action?: React.ReactElement
  other?: boolean
  recent?: boolean
}

export const SessionsList: React.FC<Props> = ({ sessions, title, action, other, recent }) => {
  if (!sessions.length) return null

  return (
    <>
      <Typography variant="subtitle1">
        <Title enabled={!recent}>{title}</Title>
        {action}
      </Typography>
      {sessions.map((s, i) => (
        <SessionListItem session={s} key={i} other={other} recent={recent} />
      ))}
    </>
  )
}
