import React from 'react'
import { useParams } from 'react-router-dom'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ServiceList } from '../../components/ServiceList'

const mapState = (state: ApplicationState, params: any) => ({
  connections: state.devices.connections.reduce((result: ConnectionLookup, c: ConnectionInfo) => {
    result[c.id] = c
    return result
  }, {}),
  devices: state.devices.all,
})

const mapDispatch = (dispatch: any) => ({
  // setAdded: dispatch.jump.setAdded,
})

export type ServicesPageProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch> & {
    // id: string
  }

export const ServicesPage = connect(
  mapState,
  mapDispatch
)(({ connections, devices }: ServicesPageProps) => {
  const { deviceID } = useParams()
  const device = devices.find(d => d.id === deviceID)

  if (!device) return <div>No device found.</div>

  return (
    <>
      <Breadcrumbs />
      <h2>Services</h2>
      <ServiceList services={device.services} connections={connections} />
    </>
  )
})
