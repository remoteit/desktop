import React from 'react'
import { getAttributes } from '../helpers/attributes'
import { useApplication } from '../hooks/useApplication'
import { ListItemCopy } from './ListItemCopy'
import { DataDisplay } from './DataDisplay'
import { Collapse } from '@material-ui/core'

type Props = {
  connection?: IConnection
  session?: ISession
  show?: boolean
}

export const ConnectionDetails: React.FC<Props> = ({ show, connection, session }) => {
  const attributes = getAttributes(['connection', 'duration', 'location', 'initiatorPlatform'])
  const app = useApplication('copy', undefined, connection)

  return (
    <Collapse in={show} timeout={800}>
      <ListItemCopy label="Command" value={app.command} />
      <DataDisplay attributes={attributes} connection={connection} session={session} width={100} />
    </Collapse>
  )
}
