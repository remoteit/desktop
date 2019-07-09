import React from 'react'
import { ConnectedServiceItem } from '../../components/ConnectedServiceItem'

export interface Props {
  connections: ConnectionInfo[]
}

export function ConnectionsList({ connections }: Props) {
  if (!connections || !connections.length) {
    return (
      <div
        className="px-md py-md gray mx-auto italic center"
        style={{ maxWidth: '400px' }}
      >
        <strong>You have no running connections yet.</strong> Please find a
        service to connect to and press the connect button and you will see them
        in this list.
      </div>
    )
  }

  return (
    <>
      {connections.map(c => (
        <ConnectedServiceItem key={c.id} connection={c} />
      ))}
    </>
  )
}
