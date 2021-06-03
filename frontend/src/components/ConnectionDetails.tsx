import React from 'react'
import { getAttributes } from '../helpers/attributes'
import { Collapse } from '@material-ui/core'
import { DataDisplay } from './DataDisplay'

type Props = {
  connection?: IConnection
  session?: ISession
  show?: boolean
}

export const ConnectionDetails: React.FC<Props> = ({ show, connection, session }) => {
  const attributes = getAttributes(['connection', 'duration', 'location', 'initiatorPlatform'])

  return (
    <Collapse in={show} timeout={800}>
      <DataDisplay attributes={attributes} connection={connection} session={session} width={100} />
    </Collapse>
  )
}
