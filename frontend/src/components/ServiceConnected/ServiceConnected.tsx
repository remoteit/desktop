import React from 'react'
import { hostName } from '../../helpers/nameHelper'
import { DisconnectButton } from '../../buttons/DisconnectButton'
import { Typography, Divider, Collapse } from '@material-ui/core'
import { DataDisplay } from '../DataDisplay'
import { Throughput } from '../Throughput'
import { Duration } from '../Duration'
import { Columns } from '../Columns'

type Props = {
  connection?: IConnection
  service?: IService
}

export const ServiceConnected: React.FC<Props> = ({ connection, service }) => {
  const visible = connection && connection.active

  return (
    <Collapse in={visible} timeout={800}>
      <Typography color="primary" variant="subtitle1">
        Connected
      </Typography>
      <Columns inset>
        <DataDisplay
          data={[
            { label: 'Connection URL', value: connection && hostName(connection) },
            { label: 'Duration', value: connection && <Duration startTime={connection.startTime} /> },
            { label: 'Throughput', value: connection && <Throughput connection={connection} /> },
          ]}
        />
        <div>
          <DisconnectButton connection={connection} service={service} size="medium" />
        </div>
      </Columns>
      <Divider />
    </Collapse>
  )
}
