import React from 'react'
import { ConnectionsList } from '../../components/ConnectionsList'
import { IDevice, IService } from 'remote.it'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'

export const ConnectionsPage: React.FC = () => {
  const connections = useSelector((state: ApplicationState) => state.devices.connections)
  const services = useSelector((state: ApplicationState) =>
    findServices(state.devices.all, state.devices.connections.map(c => c.id))
  )
  return <ConnectionsList connections={connections} services={services} />
}

function findServices(devices: IDevice[], ids: string[]) {
  return devices.reduce((all: IService[], d: IDevice) => {
    const service = d.services.find(s => ids.includes(s.id))
    if (service) all.push(service)
    return all
  }, [])
}
