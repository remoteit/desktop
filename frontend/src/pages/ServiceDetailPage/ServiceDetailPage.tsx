import React, { useEffect } from 'react'
import { ServiceHeaderMenu } from '../../components/ServiceHeaderMenu'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { DataDisplay } from '../../components/DataDisplay'
import { useParams } from 'react-router-dom'
import { Columns } from '../../components/Columns'
import { ComboButton } from '../../buttons/ComboButton'
import { Gutters } from '../../components/Gutters'
import analyticsHelper from '../../helpers/analyticsHelper'

export const ServiceDetailPage: React.FC<{ device?: IDevice; targets: ITarget[] }> = ({ device, targets }) => {
  const { serviceID } = useParams<{ serviceID: string }>()
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const service = device?.services.find(s => s.id === serviceID)
  const target = targets.find(t => t.uid === serviceID)

  useEffect(() => {
    analyticsHelper.page('ServiceDetailPage')
  }, [])

  if (!service || !device) return null

  let data: IDataDisplay[] = []

  if (connection && connection.connected) {
    data = data.concat([
      { label: 'Host', value: connection.host },
      { label: 'Port', value: connection.port },
      { label: 'Restriction', value: connection.restriction },
    ])
  }

  data = data.concat([
    { label: 'Last reported', value: service.lastReported, format: 'duration' },
    { label: 'Service Name', value: service.name },
    { label: 'Remote Port', value: service.port },
    { label: 'Remote Protocol', value: service.protocol },
    { label: 'Service Type', value: service.type },
    { label: 'Device Name', value: device.name },
    { label: 'Owner', value: device.owner.email },
    { label: 'Service ID', value: service.id },
  ])

  return (
    <ServiceHeaderMenu
      device={device}
      service={service}
      target={target}
      footer={
        <Gutters>
          <ComboButton connection={connection} service={service} size="medium" />
        </Gutters>
      }
    >
      <Columns count={1} inset>
        <DataDisplay data={data} />
      </Columns>
    </ServiceHeaderMenu>
  )
}
