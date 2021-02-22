import React from 'react'
import { hostName } from '../../shared/nameHelper'
import { DisconnectButton } from '../../buttons/DisconnectButton'
import { Typography, Divider, Collapse } from '@material-ui/core'
import { DataDisplay } from '../DataDisplay'
import { Duration } from '../Duration'

type Props = {
  connection?: IConnection
  service?: IService
}

export const ServiceConnected: React.FC<Props> = ({ connection, service }) => {
  const visible = connection?.connected

  return (
    <Collapse in={visible} timeout={800}>
      <Typography color={connection?.connecting ? undefined : 'primary'} variant="subtitle1">
        {connection?.connecting ? 'Connecting' : 'Connected'}
      </Typography>
      <DisconnectButton connection={connection} service={service} />
      <DataDisplay
        data={[
          { label: 'Connection URL', value: connection && hostName(connection) },
          {
            label: 'Connection Type',
            value: connection?.isP2P === undefined ? 'None' : connection?.isP2P === true ? 'Peer to peer' : 'Proxy',
          },
          { label: 'Duration', value: connection && <Duration startTime={connection.startTime} /> },
        ]}
      />
      <Divider />
    </Collapse>
  )
}
