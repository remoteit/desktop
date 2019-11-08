import React from 'react'
import { useParams } from 'react-router-dom'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { Typography } from '@material-ui/core'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ServiceList } from '../../components/ServiceList'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { makeStyles } from '@material-ui/styles'
import styles from '../../styling'

const mapState = (state: ApplicationState, params: any) => ({
  connections: state.jump.connections.reduce((result: ConnectionLookup, c: IConnection) => {
    result[c.id] = c
    return result
  }, {}),
  devices: state.devices.all,
})

export type ServicesPageProps = ReturnType<typeof mapState>

export const ServicesPage = connect(mapState)(({ connections, devices }: ServicesPageProps) => {
  const { deviceID } = useParams()
  const device = devices.find(d => d.id === deviceID)
  const css = useStyles()

  if (!device) return <div>No device found.</div>

  return (
    <Breadcrumbs>
      <Typography variant="subtitle1">
        <ConnectionStateIcon state={device.state} size="lg" />
        <span className={css.title}>{device.name}</span>
      </Typography>
      <ServiceList services={device.services} connections={connections} />
    </Breadcrumbs>
  )
})

const useStyles = makeStyles({
  title: { flexGrow: 1, marginLeft: styles.spacing.md },
})
