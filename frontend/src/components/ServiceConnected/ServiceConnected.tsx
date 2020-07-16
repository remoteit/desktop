import React from 'react'
import { hostName } from '../../shared/nameHelper'
import { DisconnectButton } from '../../buttons/DisconnectButton'
import { Typography, Divider, Collapse } from '@material-ui/core'
import { DataDisplay } from '../DataDisplay'
import { Duration } from '../Duration'
import { Columns } from '../Columns'

type Props = {
  connection?: IConnection
  service?: IService
}

export const ServiceConnected: React.FC<Props> = ({ connection, service }) => {
  const visible = connection?.active

  return (
    <Collapse in={visible} timeout={800}>
      <Typography color={connection?.connecting ? undefined : 'primary'} variant="subtitle1">
        {connection?.connecting ? 'Connecting' : 'Connected'}
      </Typography>
      <Columns inset>
        <DataDisplay
          data={[
            { label: 'Connection URL', value: connection && hostName(connection) },
            { label: 'Duration', value: connection && <Duration startTime={connection.startTime} /> },
          ]}
        />
        <div>
          <DisconnectButton connection={connection} service={service} />
        </div>
      </Columns>
      <Divider />
    </Collapse>
  )
}
