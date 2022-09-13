import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { ServiceHeaderMenu } from '../components/ServiceHeaderMenu'
import { selectConnection } from '../helpers/connectionHelper'
import { Connect } from '../components/Connect'

export const ServiceConnectPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { serviceID } = useParams<{ serviceID: string }>()
  const service = device?.services.find(s => s.id === serviceID)
  const { connection } = useSelector((state: ApplicationState) => ({
    connection: selectConnection(state, service),
  }))

  if (!service || !device) return null

  return (
    <ServiceHeaderMenu
      device={device}
      service={service}
      backgroundColor={connection.enabled ? 'primaryBackground' : 'grayLighter'}
    >
      <Connect />
    </ServiceHeaderMenu>
  )
}
