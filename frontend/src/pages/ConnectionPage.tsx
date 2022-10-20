import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { selectById } from '../models/devices'
import { Typography } from '@mui/material'
import { getDeviceModel } from '../models/accounts'
import { selectSharedNetwork } from '../models/networks'
import { selectConnection } from '../helpers/connectionHelper'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { ServiceAttributes } from '../components/ServiceAttributes'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { NoConnectionPage } from './NoConnectionPage'
import { LinearProgress } from '../components/LinearProgress'
import { ConnectionName } from '../components/ConnectionName'
import { InfoButton } from '../buttons/InfoButton'
import { Container } from '../components/Container'
import { Connect } from '../components/Connect'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'

export const ConnectionPage: React.FC = () => {
  const { serviceID } = useParams<{ serviceID?: string }>()
  const dispatch = useDispatch<Dispatch>()
  const { service, device, network, connection, waiting, accordion } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceID)
    const { initialized, fetching } = getDeviceModel(state)
    return {
      service,
      device,
      waiting: !initialized || fetching,
      network: selectSharedNetwork(state, serviceID),
      connection: selectConnection(state, service),
      accordion: state.ui.accordion,
    }
  })

  const [loaded, setLoaded] = useState<string | undefined>()
  const instance: IInstance | undefined = network || device

  useEffect(() => {
    if (serviceID && !instance?.loaded && !waiting) {
      if (loaded === serviceID) {
        dispatch.ui.set({ errorMessage: `You do not have access to that service. (${serviceID})` })
        if (connection) dispatch.connections.forget(serviceID)
      } else {
        if (network) dispatch.networks.fetchSingle(network)
        else dispatch.devices.fetchSingle({ id: serviceID, hidden: true })
        setLoaded(serviceID)
      }
    }
  }, [waiting, instance, loaded])

  if (!service) return <NoConnectionPage />

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      backgroundColor={connection.enabled ? 'primaryBackground' : 'grayLighter'}
      header={
        <>
          <Typography variant="h1" gutterBottom={!service?.attributes.description}>
            <Title>
              <ConnectionName name={connection.name} />
            </Title>
            {!network && device && <InfoButton device={device} service={service} />}
          </Typography>
          {service?.attributes.description && (
            <Gutters bottom="xl" top={null}>
              <Typography variant="body2" color="textSecondary">
                {service?.attributes.description}
              </Typography>
            </Gutters>
          )}
          <LinearProgress loading={waiting} />
        </>
      }
    >
      <Connect service={service} instance={instance} connection={connection} />
      <Gutters size="md">
        <AccordionMenuItem
          gutters
          subtitle="Service Details"
          expanded={accordion.service}
          onClick={() => dispatch.ui.accordion({ service: !accordion.service })}
        >
          <ServiceAttributes service={service} disablePadding />
        </AccordionMenuItem>
      </Gutters>
    </Container>
  )
}
