import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Typography } from '@material-ui/core'
import { IService } from 'remote.it'

export const ServicePage = () => {
  const { deviceID, serviceID } = useParams()
  const device = useSelector((state: ApplicationState) => state.devices.all.find(d => d.id === deviceID))
  const connection = useSelector((state: ApplicationState) => state.devices.connections.find(c => c.id === serviceID))
  const service = device && device.services.find(s => s.id === serviceID)

  console.log('------------------->', device)
  console.log('------------------->', service)
  console.log('------------------->', connection)

  return (
    <>
      <Breadcrumbs device={device} />
      <Typography variant="subtitle1">{service && service.name}</Typography>
      <section>
        device: {JSON.stringify(device)}
        <br />
        service: {JSON.stringify(service)}
      </section>
    </>
  )
}
