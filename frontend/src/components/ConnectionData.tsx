import React from 'react'
import { Box } from '@mui/material'
import { getAttributes } from './Attributes'
import { ConnectionChecklist } from './ConnectionChecklist'
import { useApplication } from '../hooks/useApplication'
import { DataDisplay } from './DataDisplay'
import { Gutters } from './Gutters'

type Props = {
  connection?: IConnection
  service?: IService
  session?: ISession
}

export const ConnectionData: React.FC<Props> = ({ connection, service, session }) => {
  let attributes = getAttributes(['lanShare', 'connection', 'session', 'duration', 'location', 'initiatorPlatform'])
  const app = useApplication(service, connection)

  if (!connection && !session) return null

  return (
    <Gutters bottom="md">
      <Box display="flex" flexDirection="row">
        <DataDisplay
          attributes={attributes}
          connection={connection}
          session={session}
          application={app}
          width={100}
          disablePadding
        />
        <ConnectionChecklist connection={connection} />
      </Box>
    </Gutters>
  )
}
