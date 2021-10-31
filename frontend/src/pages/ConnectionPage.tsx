import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Typography } from '@material-ui/core'
import { selectById } from '../models/devices'
import { selectConnection } from '../helpers/connectionHelper'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { ServiceAttributes } from '../components/ServiceAttributes'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { NoConnectionPage } from './NoConnectionPage'
import { LoadingMessage } from '../components/LoadingMessage'
import { InfoButton } from '../buttons/InfoButton'
import { Container } from '../components/Container'
import { Connect } from '../components/Connect'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const ConnectionPage: React.FC = () => {
  const { deviceID, serviceID } = useParams<{ deviceID?: string; serviceID?: string }>()
  const { devices, ui } = useDispatch<Dispatch>()
  const { service, device, connection, fetching, accordion } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceID)
    return {
      service,
      device,
      connection: selectConnection(state, service),
      fetching: state.devices.fetching,
      accordion: state.ui.accordion,
    }
  })

  useEffect(() => {
    analyticsHelper.page('ServicePage')
    const id = connection?.deviceID || deviceID

    if (!device && id) devices.fetchSingle({ id, hidden: true })
  }, [deviceID])

  if (!device && fetching) return <LoadingMessage message="Fetching data..." />
  if (!service || !device) return <NoConnectionPage />

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1" gutterBottom>
          <Title>{connection.name}</Title>
          <InfoButton device={device} service={service} />
        </Typography>
      }
    >
      <Connect />
      <AccordionMenuItem
        subtitle="Service Details"
        expanded={accordion.service}
        onClick={() => ui.accordion({ service: !accordion.service })}
        gutterTop
      >
        <ServiceAttributes service={service} disablePadding />
      </AccordionMenuItem>
    </Container>
  )
}
