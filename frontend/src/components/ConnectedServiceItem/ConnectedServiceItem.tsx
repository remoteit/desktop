import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { CopyableText } from '../CopyableText'
import { DisconnectButtonController } from '../../controllers/DisconnectButtonController/DisconnectButtonController'

export interface ConnectedServiceItemProps {
  name: string
  serviceID: string
  port?: number
  type?: string
}

export function ConnectedServiceItem({
  name,
  port,
  serviceID,
  type = '',
}: ConnectedServiceItemProps) {
  return (
    <div className="df ai-center bb bc-gray-lighter px-md py-xs">
      <div className="mr-md">
        <ConnectionStateIcon state="connected" size="lg" />
      </div>
      <div>
        <div className="txt-md gray-darkest">{name}</div>
        {name.toLowerCase() !== type.toLowerCase() && (
          <div className="txt-sm gray-light">{type}</div>
        )}
      </div>
      <div className="ml-auto df ai-center">
        {port && (
          <CopyableText value={`localhost:${port}`} className="txt-md" />
        )}
        <DisconnectButtonController serviceID={serviceID} />
      </div>
    </div>
  )
}
