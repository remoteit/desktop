import React, { useEffect } from 'react'
import { ConnectionsList } from '../../components/ConnectionsList'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import heartbeat from '../../services/Heartbeat'
import analytics from '../../helpers/Analytics'

export const ConnectionsPage: React.FC = () => {
  const connections = useSelector((state: ApplicationState) => state.backend.connections.filter(c => !!c.startTime))
  const services = useSelector((state: ApplicationState) =>
    findServices(
      state.devices.all,
      connections.map(c => c.id)
    )
  )
  useEffect(() => {
    heartbeat.beat()
    analytics.page('ConnectionsPage')
  }, [])

  return <ConnectionsList connections={connections} services={services} />
}

function findServices(devices: IDevice[], ids: string[]) {
  return devices.reduce((all: IService[], d: IDevice) => {
    const service = d.services.filter(s => ids.includes(s.id))
    return service ? all.concat(service) : all
  }, [])
}
