import React from 'react'
import { ConnectionsList } from '../../components/ConnectionsList'
import { IDevice, IService } from 'remote.it'
import { ApplicationState } from '../../store'
import { connect } from 'react-redux'

const mapState = (state: ApplicationState) => ({
  connections: state.devices.connections,
  services: findServices(state.devices.all, state.devices.connections.map(c => c.id)),
})

export type ConnectionsPageProps = ReturnType<typeof mapState>

export const ConnectionsPage = connect(mapState)(({ connections, services }: ConnectionsPageProps) => {
  return <ConnectionsList connections={connections} services={services} />
})

function findServices(devices: IDevice[], ids: string[]) {
  return devices.reduce((all: IService[], d: IDevice) => {
    const service = d.services.find(s => ids.includes(s.id))
    if (service) all.push(service)
    return all
  }, [])
}
