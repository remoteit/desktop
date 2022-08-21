import React from 'react'
import { Body } from '../../components/Body'
import { Container } from '../../components/Container'
import { Typography } from '@mui/material'
import { ServiceName } from '../../components/ServiceName'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'

type Props = { connection?: IConnection; device?: boolean }

export const UnauthorizedPage: React.FC<Props> = ({ connection, device }) => {
  const name = device ? 'device' : 'service'
  return (
    <Container
      header={
        <Typography variant="h1">
          <ConnectionStateIcon size="lg" />
          <ServiceName inline />
        </Typography>
      }
    >
      <Body center>
        <Typography variant="body1" align="center">
          You are not authorized to access this {name}. <br />
          To gain access, please have the device owner share it with you.
        </Typography>
        {connection && <Typography variant="caption">Device may have been removed ({connection.deviceID})</Typography>}
      </Body>
    </Container>
  )
}
