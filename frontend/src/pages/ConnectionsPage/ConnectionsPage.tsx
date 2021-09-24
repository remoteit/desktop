import React, { useEffect } from 'react'
import { matchPath, useHistory, useLocation } from 'react-router-dom'
import { makeStyles, Typography, Link } from '@material-ui/core'
import { selectConnections, connectionState } from '../../helpers/connectionHelper'
import { ApplicationState } from '../../store'
import { SessionsList } from '../../components/SessionsList'
import { ClearButton } from '../../buttons/ClearButton'
import { useSelector } from 'react-redux'
import { selectById } from '../../models/devices'
import analyticsHelper from '../../helpers/analyticsHelper'
import heartbeat from '../../services/Heartbeat'
import styles from '../../styling'

export const ConnectionsPage: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const { local, other, recent } = useSelector((state: ApplicationState) => {
    const allConnections = selectConnections(state)

    let local: ISession[] = []
    let other: ISession[] = []
    let recent: ISession[] = []

    for (const session of state.sessions.all) {
      const index = allConnections.findIndex(c => c.sessionId === session.id)
      if (index > -1) {
        session.state = connectionState(undefined, allConnections[index])
        local.push(session)
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
      if (connection.enabled) local.push(session)
      else recent.push(session)
    }

    return { local, other, recent }
  })

  const showNew = matchPath(location.pathname, { path: '/connections/new' })
  const noConnections = !local.length && !other.length && !recent.length

  useEffect(() => {
    heartbeat.beat()
    analyticsHelper.page('ConnectionsPage')
  }, [])

  return (
    <>
      {noConnections && (
        <>
          <Typography className={css.message} variant="h2" align="center">
            Use this page to add services to your local network.
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary">
            Once you've added a service from the<Link onClick={() => history.push('/devices')}>Devices</Link>tab, <br />
            active and recent services will appear here.
          </Typography>
        </>
      )}
      <SessionsList title="Local Network" sessions={local} />
      <SessionsList title="Others" sessions={other} other />
      <SessionsList title="Recent" sessions={recent} action={!!recent && <ClearButton all />} recent />
    </>
  )
}

const useStyles = makeStyles({
  message: { marginBottom: styles.spacing.xl, marginTop: '5vw' },
})
