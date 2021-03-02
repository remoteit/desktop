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
  let prev: string | undefined

  return (
    <>
      <Typography variant="subtitle1">
        <Title enabled={!recent}>{title}</Title>
        {action}
      </Typography>
      {sessions.map((s, i) => {
        const merge = prev === s.user?.id
        prev = s.user?.id
        return <SessionListItem session={s} key={i} merge={merge} other={other} recent={recent} />
      })}
    </>
  )
}
