import React, { useEffect } from 'react'
import { Body } from '../../components/Body'
import { matchPath, useHistory, useLocation, Link } from 'react-router-dom'
import { makeStyles, Typography, Collapse } from '@material-ui/core'
import { NewConnectionButton } from '../../buttons/NewConnectionButton'
import { selectConnections } from '../../helpers/connectionHelper'
import { ApplicationState } from '../../store'
import { NewConnection } from '../../components/NewConnection'
import { SessionsList } from '../../components/SessionsList'
import { ClearButton } from '../../buttons/ClearButton'
import { useSelector } from 'react-redux'
import { selectById } from '../../models/devices'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
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
        local.push(session)
        allConnections.splice(index, 1)
      } else {
        other.push(session)
      }
    }

    for (const connection of allConnections) {
      const [_, device] = selectById(state, connection.id)
      const session = {
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
      }
      if (connection.enabled) local.push(session)
      else recent.push(session)
    }

    return { local, other, recent }
  })

  const showNew = matchPath(location.pathname, { path: '/connections/new' })

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
          <Link to="/devices"> Devices </Link> tab, <br />
          active and recent connections will appear here.
        </Typography>
      </Body>
    )
  }

  return (
    <Container
      integrated
      header={
        <>
          {singlePanel && (
            <Collapse in={!showNew} timeout={800}>
              <Gutters inset>
                <NewConnectionButton />
              </Gutters>
            </Collapse>
          )}
          <Collapse in={!!showNew} timeout={800}>
            <NewConnection />
          </Collapse>
        </>
      }
    >
      <SessionsList title="Connected" sessions={local} />
      <SessionsList title="From Others" sessions={other} other />
      <SessionsList title="Recent" sessions={recent} action={<ClearButton all />} recent />
    </Container>
  )
}

const useStyles = makeStyles({
  message: { marginBottom: styles.spacing.xl },
})
