import React from 'react'
import { IDevice, IService } from 'remote.it'
import { ConnectionsList } from '../../components/ConnectionsList'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'

export const ConnectionsPage: React.FC = () => {
  const connections = useSelector((state: ApplicationState) => state.backend.connections.filter(c => !!c.startTime))
  const services = useSelector((state: ApplicationState) =>
    findServices(
      state.devices.all,
      connections.map(c => c.id)
    )
  )
  return <ConnectionsList connections={connections} services={services} />
}

function findServices(devices: IDevice[], ids: string[]) {
  return devices.reduce((all: IService[], d: IDevice) => {
    const service = d.services.filter(s => ids.includes(s.id))
    return service ? all.concat(service) : all
  }, [])
}
