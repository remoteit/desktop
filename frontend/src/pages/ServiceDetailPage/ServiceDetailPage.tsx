import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Typography, Divider } from '@material-ui/core'
import { useHistory, useParams, useLocation } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { ApplicationState } from '../../store'
import { Container } from '../../components/Container'
import { Body } from '../../components/Body'
import { Columns } from '../../components/Columns'
import { Title } from '../../components/Title'
import { DataDisplay } from '../../components/DataDisplay'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { findService } from '../../models/devices'
import { spacing, colors, fontSizes } from '../../styling'
import { Icon } from '../../components/Icon'

export const ServiceDetailPage = () => {
  const css = useStyles()
  const { serviceID = '' } = useParams()
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))

  let data: IDataDisplay[] = []

  useEffect(() => {
    analytics.page('ServiceDetailPage')
  }, [])

  if (!service || !device) return null

  if (connection && connection.active) {
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
    { label: 'Service Type', value: service.type },
    { label: 'Device Name', value: device.name },
    { label: 'Owner', value: device.owner },
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
            <Title>Service details</Title>
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

const useStyles = makeStyles({})
