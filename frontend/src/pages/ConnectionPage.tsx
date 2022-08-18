import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Typography } from '@mui/material'
import { selectById } from '../models/devices'
import { getDeviceModel } from '../models/accounts'
import { inNetworkOnly } from '../models/networks'
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
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const ConnectionPage: React.FC = () => {
  const { deviceID, serviceID } = useParams<{ deviceID?: string; serviceID?: string }>()
  const { devices, ui } = useDispatch<Dispatch>()
  const { service, device, networkOnly, connection, fetching, accordion } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceID)
    return {
      service,
      device,
      networkOnly: inNetworkOnly(state, serviceID),
      connection: selectConnection(state, service),
      fetching: getDeviceModel(state).fetching,
      accordion: state.ui.accordion,
    }
  })

  useEffect(() => {
    analyticsHelper.page('ServicePage')
    const id = connection?.deviceID || deviceID

    if (!device && id) devices.fetchSingle({ id, hidden: true })
  }, [deviceID])

  if (!device && fetching) return <LoadingMessage message="Fetching data" />
  if (!service || !device) return <NoConnectionPage />

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      backgroundColor={connection.enabled ? 'primaryBackground' : 'grayLighter'}
      header={
        <>
          <Typography variant="h1" gutterBottom={!service.attributes.description}>
            <Title>{connection.name}</Title>
            {!networkOnly && <InfoButton device={device} service={service} />}
          </Typography>
          {service.attributes.description && (
            <Gutters bottom="xl" top={null}>
              <Typography variant="body2" color="textSecondary">
                {service.attributes.description}
              </Typography>
            </Gutters>
          )}
        </>
      }
    >
      <Connect />
      <Gutters size="md">
        <AccordionMenuItem
          gutters
          subtitle="Service Details"
          expanded={accordion.service}
          onClick={() => ui.accordion({ service: !accordion.service })}
        >
          <ServiceAttributes service={service} disablePadding />
        </AccordionMenuItem>
      </Gutters>
    </Container>
  )
}
