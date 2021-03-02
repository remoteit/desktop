import React from 'react'
import { hostName } from '../../shared/nameHelper'
import { Typography, Divider, Collapse } from '@material-ui/core'
import { DataDisplay } from '../DataDisplay'
import { Duration } from '../Duration'
import { Gutters } from '../Gutters'

type Props = {
  connection?: IConnection
  session?: ISession
  show?: boolean
}

export const ServiceConnected: React.FC<Props> = ({ show, connection, session }) => {
  return (
    <Collapse in={show} timeout={800}>
      <Gutters inset>
        {/* <pre>{JSON.stringify(session, null, 2)}</pre> */}
        <DataDisplay
          data={[
            // { label: 'Initiator', value:  },
            { label: 'Connection URL', value: connection && hostName(connection) },
            {
              label: 'Connection Type',
              value:
                connection?.isP2P === undefined && session?.isP2P === undefined
                  ? 'None'
                  : connection?.isP2P || session?.isP2P
                  ? 'Peer to peer'
                  : 'Proxy',
            },
            {
              label: 'Duration',
              value: (connection || session) && (
                <Duration startTime={connection?.startTime || session?.timestamp?.getTime()} />
              ),
            },
            { label: 'Location', value: session?.geo, format: 'location' },
          ]}
        />
      </Gutters>
    </Collapse>
  )
}
