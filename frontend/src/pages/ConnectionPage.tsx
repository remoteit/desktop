import React from 'react'
import { Typography } from '@mui/material'
import { DeviceContext } from '../services/Context'
import { NoConnectionPage } from './NoConnectionPage'
import { ConnectionName } from '../components/ConnectionName'
import { InfoButton } from '../buttons/InfoButton'
import { Container } from '../components/Container'
import { Diagram } from '../components/Diagram'
import { Connect } from '../components/Connect'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'

export const ConnectionPage: React.FC = () => {
  const { connection, device, service, network } = React.useContext(DeviceContext)

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
          <Gutters>
            <Diagram />
          </Gutters>
        </>
      }
    >
      <Connect />
    </Container>
  )
}
