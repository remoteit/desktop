import React, { useContext } from 'react'
import { DeviceContext } from '../services/Context'
import { ServiceHeaderMenu } from '../components/ServiceHeaderMenu'
import { Connect } from '../components/Connect'

export const ServiceConnectPage: React.FC = () => {
  const { device, service, connection } = useContext(DeviceContext)

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
