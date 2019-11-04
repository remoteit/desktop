import React from 'react'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Typography } from '@material-ui/core'
import { LanShareSelect } from '../../components/LanShareSelect'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { DisconnectButton } from '../../components/DisconnectButton'
import { RestartButton } from '../../components/RestartButton'
import { ConnectButton } from '../../components/ConnectButton'
import { ForgetButton } from '../../components/ForgetButton'
import { CopyButton } from '../../components/CopyButton'
import { makeStyles } from '@material-ui/styles'
import styles from '../../styling'

export const ServicePage: React.FC = () => {
  const { serviceID } = useParams()
  const connection = useSelector((state: ApplicationState) => state.devices.connections.find(c => c.id === serviceID))
  const device = useSelector((state: ApplicationState) =>
    state.devices.all.find(d => d.services.find(s => s.id === serviceID))
  )
  const service = device && device.services.find(s => s.id === serviceID)
  const history = useHistory()
  const location = useLocation()
  const css = useStyles()

  console.log('device:', device)
  console.log('service:', service)

  return (
    <>
      <Breadcrumbs />
      <Typography variant="subtitle1">
        <ConnectionStateIcon connection={connection} service={service} size="lg" />
        <span className={css.title}>{service && service.name}</span>
        <CopyButton connection={connection} />
        <DisconnectButton connection={connection} />
        <ForgetButton connection={connection} />
        <RestartButton connection={connection} />
        <ConnectButton connection={connection} service={service} />
      </Typography>
      <section>
        <LanShareSelect onClick={() => history.push(location.pathname + '/lan')} />
      </section>
    </>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1, marginLeft: styles.spacing.md },
})
