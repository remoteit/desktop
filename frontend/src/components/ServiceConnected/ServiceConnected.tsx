import React from 'react'
import { hostName } from '../../shared/nameHelper'
import { INITIATOR_PLATFORMS } from '../InitiatorPlatform/InitiatorPlatform'
import { Collapse } from '@material-ui/core'
import { DataDisplay } from '../DataDisplay'
import { Gutters } from '../Gutters'

type Props = {
  connection?: IConnection
  session?: ISession
  show?: boolean
}

export const ServiceConnected: React.FC<Props> = ({ show, connection, session }) => {
  return (
    <Gutters inset>
      <Collapse in={show} timeout={800}>
        {/* <pre>{JSON.stringify(session, null, 2)}</pre> */}
        <DataDisplay
          data={[
            { label: 'Connection URL', value: connection && hostName(connection) },
            {
              label: 'Connection',
              value:
                connection?.isP2P === undefined && session?.isP2P === undefined
                  ? 'Idle'
                  : connection?.isP2P || session?.isP2P
                  ? 'Peer to peer'
                  : 'Proxy',
            },
            {
              label: 'Duration',
              value: connection?.startTime ? new Date(connection.startTime || 0) : session?.timestamp,
              format: 'duration',
            },
            { label: 'Location', value: session?.geo, format: 'location' },

            { label: 'Platform', value: session && INITIATOR_PLATFORMS[session.platform] },
            { label: 'Device ID', value: session?.target.deviceId },
            { label: 'Service ID', value: session?.target.id },
          ]}
        />
      </Collapse>
    </Gutters>
  )
}
