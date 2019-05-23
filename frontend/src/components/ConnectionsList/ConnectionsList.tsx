import React from 'react'
import { ConnectedServiceItem } from '../../components/ConnectedServiceItem'

export interface Props {
  connections: Connection[]
}

export function ConnectionsList({ connections }: Props) {
  if (!connections || !connections.length) {
    return (
      <div className="p-md gray italic center">
        <strong>You have no running connections yet.</strong> Please find a
        service to connect to and press the connect button and you will see them
        in this list.
      </div>
    )
  }

  return (
    <>
      {connections.map(c => (
        <ConnectedServiceItem
          key={c.serviceID}
          name={c.serviceName}
          port={c.port}
          type={c.type}
          serviceID={c.serviceID}
        />
      ))}
    </>
  )
}
