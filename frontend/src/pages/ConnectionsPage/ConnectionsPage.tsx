import React, { useEffect } from 'react'
import { Body } from '../../components/Body'
import { useHistory } from 'react-router-dom'
import { makeStyles, Typography, Divider, Link } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { ConnectionsList } from '../../components/ConnectionsList'
import { SessionsList } from '../../components/SessionsList'
import { useSelector } from 'react-redux'
import { getDevices } from '../../models/accounts'
import analyticsHelper from '../../helpers/analyticsHelper'
import heartbeat from '../../services/Heartbeat'
import styles from '../../styling'

export const ConnectionsPage: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const { connections, services, sessions } = useSelector((state: ApplicationState) => {
    const connections = state.backend.connections.filter(c => !!c.startTime)
    const devices = getDevices(state)
    return {
      connections,
      services: findServices(
        devices,
        connections.map(c => c.id)
      ),
      sessions: devices.reduce((sessions: ISession[], d) => {
        if (!d.hidden)
          d.services.forEach(s =>
            s.sessions.forEach(u => {
              sessions.push({
                device: d,
                service: s,
                user: u,
              })
            })
          )
        return sessions
      }, []),
    }
  })

  useEffect(() => {
    heartbeat.beat()
    analyticsHelper.page('ConnectionsPage')
  }, [])

  if (!connections.length && !sessions.length) {
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
    <>
      <ConnectionsList connections={connections} services={services} />
      {!!connections.length && !!sessions.length && <Divider />}
      <SessionsList sessions={sessions} />
    </>
  )
}

function findServices(devices: IDevice[], ids: string[]) {
  return devices.reduce((all: IService[], d: IDevice) => {
    const service = d.services.filter(s => ids.includes(s.id))
    return service ? all.concat(service) : all
  }, [])
}

const useStyles = makeStyles({
  message: { marginBottom: styles.spacing.xl },
})
