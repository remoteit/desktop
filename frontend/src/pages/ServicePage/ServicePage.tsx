import React from 'react'
import { withRouter, useParams } from 'react-router-dom'
import { connect, useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { IService } from 'remote.it'

// const mapState = (state: ApplicationState, params: any) => {}
// const mapDispatch = (dispatch: any) => ({})

// export type ServicePageProps = ReturnType<typeof mapState> &
//   ReturnType<typeof mapDispatch> & {
//     connection?: ConnectionInfo
//     service?: IService
//   }

export const ServicePage = () => {
  const { deviceID, serviceID } = useParams()
  const device = useSelector((state: ApplicationState) => state.devices.all.find(d => d.id === deviceID))
  const connection = useSelector((state: ApplicationState) => state.devices.connections.find(c => c.id === serviceID))
  const service = device && device.services.find(s => s.id === serviceID)

  console.log('------------------->', device, service, connection)
  return (
    <>
      <Breadcrumbs device={device} />
      <h2>{service && service.name}</h2>
      <section>
        device: {JSON.stringify(device)}
        <br />
        service: {JSON.stringify(service)}
      </section>
    </>
  )
}
