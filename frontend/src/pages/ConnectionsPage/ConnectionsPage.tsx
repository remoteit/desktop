import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { makeStyles, Typography, Link } from '@material-ui/core'
import { selectConnections, connectionState } from '../../helpers/connectionHelper'
import { ApplicationState } from '../../store'
import { SessionsList } from '../../components/SessionsList'
import { ClearButton } from '../../buttons/ClearButton'
import { useSelector } from 'react-redux'
import { selectById } from '../../models/devices'
import { NewSession } from '../../components/NewSession'
import { Body } from '../../components/Body'
import analyticsHelper from '../../helpers/analyticsHelper'
import heartbeat from '../../services/Heartbeat'
import styles from '../../styling'

export const ConnectionsPage: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const css = useStyles()
  const history = useHistory()
  const { local, proxy, other, recent } = useSelector((state: ApplicationState) => {
    const allConnections = selectConnections(state)

    let local: ISession[] = []
    let proxy: ISession[] = []
    let other: ISession[] = []
    let recent: ISession[] = []

    for (const session of state.sessions.all) {
      const index = allConnections.findIndex(c => c.sessionId === session.id) // @TODO assign the connection id to the session if available on parsing
      if (index > -1) {
        session.state = connectionState(undefined, allConnections[index])
        if (session.public) proxy.push(session)
        else local.push(session)
        allConnections.splice(index, 1)
      } else {
        session.state = 'connected'
        other.push(session)
      }
    }

    for (const connection of allConnections) {
      const [service, device] = selectById(state, connection.id)
      const session: ISession = {
        state: connectionState(service, connection),
        timestamp: new Date(connection.createdTime || 0),
        platform: 0,
        user: state.auth.user,
        geo: undefined,
        public: connection.public,
        target: {
          id: connection.id,
          deviceId: device?.id || '',
          platform: device?.targetPlatform || 0,
          name: connection.name || service?.name || '',
        },
      }
      if (connection.enabled) {
        if (session.public) proxy.push(session)
        else local.push(session)
      } else recent.push(session)
    }

    return { local, proxy, other, recent }
  })

  const noConnections = !local.length && !other.length && !recent.length && !proxy.length

  useEffect(() => {
    heartbeat.beat()
    analyticsHelper.page('ConnectionsPage')
  }, [])

  return (
    <Body>
      <NewSession />
      {noConnections && (
        <>
          <Typography className={css.message} variant="h2" align="center">
            Connections will appear here
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary">
            Once you've added connections from the<Link onClick={() => history.push('/devices')}>Devices</Link>tab,{' '}
            <br />
            active and recent connections will appear here.
          </Typography>
        </>
      )}
      <SessionsList title="Proxy" sessions={proxy} />
      <SessionsList title="Network" sessions={local} />
      <SessionsList title="Others" sessions={other} other />
      <SessionsList
        title="Recent"
        sessions={recent}
        action={!!recent.length ? <ClearButton all /> : undefined}
        offline
      />
    </Body>
  )
}

const useStyles = makeStyles({
  message: { marginBottom: styles.spacing.xl, marginTop: '5vw' },
})
