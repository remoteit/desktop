import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Typography } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { ApplicationState } from '../../store'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { Title } from '../../components/Title'
import { DataDisplay } from '../../components/DataDisplay'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { findService } from '../../models/devices'
import { getDevices } from '../../models/accounts'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

export const ServiceDetailPage = () => {
  const { serviceID = '' } = useParams<{ serviceID: string }>()
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(getDevices(state), serviceID))

  let data: IDataDisplay[] = []

  useEffect(() => {
    analyticsHelper.page('ServiceDetailPage')
  }, [])

  if (!service || !device) return null

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

  if (!device || !service) return null

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="info-circle" size="lg" />
            <Title inline>Service details</Title>
          </Typography>
        </>
      }
    >
      <Columns count={1} inset>
        <DataDisplay data={data} />
      </Columns>
    </Container>
  )
}
