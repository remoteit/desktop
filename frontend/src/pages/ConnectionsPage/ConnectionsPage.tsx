import React, { useEffect } from 'react'
import { Body } from '../../components/Body'
import { useHistory } from 'react-router-dom'
import { makeStyles, Typography, List, Link } from '@material-ui/core'
import { selectConnections } from '../../helpers/connectionHelper'
import { selectService } from '../../models/devices'
import { ApplicationState } from '../../store'
import { RefreshButton } from '../../buttons/RefreshButton'
import { ClearButton } from '../../buttons/ClearButton'
import { SessionsList } from '../../components/SessionsList'
import { useSelector } from 'react-redux'
import analyticsHelper from '../../helpers/analyticsHelper'
import heartbeat from '../../services/Heartbeat'
import styles from '../../styling'

export const ConnectionsPage: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const { local, other, recent } = useSelector((state: ApplicationState) => {
    const allConnections = selectConnections(state)

    let local: ISession[] = []
    let other: ISession[] = []
    let recent: ISession[] = []

    for (const session of state.sessions.all) {
      const index = allConnections.findIndex(c => c.sessionId === session.id)
      if (index > -1) {
        local.push(session)
        allConnections.splice(index, 1)
      } else {
        other.push(session)
      }
    }

    for (const connection of allConnections) {
      const [service, device] = selectService(state, connection.id)
      recent.push({
        id: state.backend.device.uid,
        timestamp: new Date(connection.startTime || 0),
        platform: state.backend.environment.manufacturerDetails?.product.platform || 0,
        user: state.auth.user,
        geo: undefined,
        target: {
          id: connection.id,
          deviceId: device?.id || '',
          platform: device?.targetPlatform || 0,
          name: connection.name,
        },
      })
    }

    return { local, other, recent }
  })

  useEffect(() => {
    heartbeat.beat()
    analyticsHelper.page('ConnectionsPage')
  }, [])

  if (!local.length && !other.length && !recent.length) {
    return (
      <Body center>
        <Typography className={css.message} variant="h2" align="center">
          Use this page to manage frequently used connections
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary">
          Once you've made a connection to a service from the
          <Link onClick={() => history.push('/devices')}> Devices </Link> tab, <br />
          active and recent connections will appear here.
        </Typography>
      </Body>
    )
  }

  return (
    <List>
      <SessionsList title="This device" sessions={local} />
      <SessionsList title="Others" sessions={other} action={<RefreshButton />} />
      <SessionsList title="Recent" sessions={recent} action={<ClearButton all />} />
    </List>
  )
}

const useStyles = makeStyles({
  message: { marginBottom: styles.spacing.xl },
})
