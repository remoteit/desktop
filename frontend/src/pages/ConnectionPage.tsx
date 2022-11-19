import React, { useEffect } from 'react'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useParams, useLocation } from 'react-router-dom'
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
import { Diagram } from '../components/Diagram'
import { Connect } from '../components/Connect'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'

export const ConnectionPage: React.FC = () => {
  const { serviceID } = useParams<{ serviceID?: string }>()
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
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

  const instance: IInstance | undefined = network || device

  useEffect(() => {
    if (serviceID && !instance?.loaded && !waiting) {
      const redirect = location.pathname.match(REGEX_FIRST_PATH)?.[0]
      if (network) dispatch.networks.fetchSingle({ network, redirect })
      else dispatch.devices.fetchSingle({ id: serviceID, hidden: true, redirect, isService: true })
    }
  }, [serviceID, waiting, instance])

  if (!service) return <NoConnectionPage />

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
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
          <Gutters size="md" bottom="sm">
            <Diagram
              to={{
                initiator: `/connections/${serviceID}`,
                target: instance?.permissions.includes('MANAGE')
                  ? `/devices/${device?.id}/${serviceID}/edit`
                  : undefined,
              }}
            />
          </Gutters>
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
