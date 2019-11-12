import React from 'react'
import { ConnectionsList } from '../../components/ConnectionsList'
import { findServices } from '../../models/devices'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'

export const ConnectionsPage: React.FC = () => {
  const connections = useSelector((state: ApplicationState) => state.backend.connections.filter(c => !!c.startTime))
  const services = useSelector((state: ApplicationState) =>
    findServices(state.devices.all, state.backend.connections.map(c => c.id))
  )
  return <ConnectionsList connections={connections} services={services} />
}
