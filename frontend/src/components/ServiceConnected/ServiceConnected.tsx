import React from 'react'
import { hostName } from '../../shared/nameHelper'
import { DisconnectButton } from '../../buttons/DisconnectButton'
import { Typography, Divider, Collapse } from '@material-ui/core'
import { DataDisplay } from '../DataDisplay'
import { Duration } from '../Duration'
import { Gutters } from '../Gutters'

type Props = {
  connection?: IConnection
  service?: IService
}

export const ServiceConnected: React.FC<Props> = ({ connection, service }) => {
  const visible = connection?.enabled
  return (
    <Collapse in={visible} timeout={800}>
      <Gutters inset>
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
      </Gutters>
    </Collapse>
  )
}
