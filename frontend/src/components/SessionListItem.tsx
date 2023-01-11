import React from 'react'
import { selectConnections } from '../selectors/connections'
import { ConnectionListItem } from './ConnectionListItem'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'

export interface Props {
  serviceId: string
  session: ISession
}

export const SessionListItem: React.FC<Props> = ({ serviceId, session }) => {
  const connection = useSelector((state: ApplicationState) =>
    selectConnections(state).find(c => c.sessionId === session.id)
  )

  let pathname = `/connections/${serviceId}/${session?.id || 'none'}`
  const match = pathname
  pathname += '/other'

  return (
    <ConnectionListItem
      name={connection?.name || session?.target.name || serviceId}
      connection={connection}
      pathname={pathname}
      match={match}
      offline={false}
      platform={session?.target.platform}
      networkEnabled
      connectionsPage
      connected
      enabled
    />
  )
}
