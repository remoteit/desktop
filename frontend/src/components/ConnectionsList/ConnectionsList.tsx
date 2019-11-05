import React from 'react'
import { List } from '@material-ui/core'
import { IService } from 'remote.it'
import { ConnectedServiceItem } from '../../components/ConnectedServiceItem'

export interface Props {
  connections: IConnection[]
  services: IService[]
}

export function ConnectionsList({ connections, services }: Props) {
  if (!connections || !connections.length) {
    return (
      <div className="px-md py-lg gray-dark mx-auto center" style={{ maxWidth: '400px' }}>
        <em className="mb">You have no running connections yet.</em>
        <p className="txt-sm grey">
          Please find a service to connect to and press the connect button and you will see them in this list.
        </p>
      </div>
    )
  }

  return (
    <List>
      {connections.map(c => (
        <ConnectedServiceItem key={c.id || 0} connection={c} service={services.find(s => s.id === c.id)} />
      ))}
    </List>
  )
}
