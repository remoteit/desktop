import { createSelector } from 'reselect'
import { getSessions, optionalId } from './state'
import { selectConnections } from './connections'

export const selectSessionUsers = createSelector(
  [selectConnections, getSessions, optionalId],
  (connections, sessions, id) => {
    let ids: string[] = []
    const activeSessionIds = connections.map(c => c.sessionId)
    return sessions.reduce((users: IUserRef[], session) => {
      if (
        session.user &&
        !ids.includes(session.user.id) &&
        !activeSessionIds.includes(session.id) &&
        (session.target.id === id || session.target.deviceId === id)
      ) {
        ids.push(session.user.id)
        users.push(session.user)
      }
      return users
    }, [])
  }
)
