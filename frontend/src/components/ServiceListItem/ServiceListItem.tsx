import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { CopyableText } from '../CopyableText'
import { ConnectButtonController } from '../../controllers/ConnectButtonController'
import { IService } from 'remote.it'
import { DisconnectButtonController } from '../../controllers/DisconnectButtonController/DisconnectButtonController'

export interface ServiceListItemProps {
  service: IService
}

export function ServiceListItem({ service }: ServiceListItemProps) {
  return (
    <div className="df ai-center bb bc-gray-lighter px-md py-xs">
      <div className="mr-md">
        <ConnectionStateIcon state={service.state} size="lg" />
      </div>
      <div>
        <div className="txt-md gray-darkest">{service.name}</div>
        {service.name.toLowerCase() !== service.type.toLowerCase() && (
          <div className="txt-sm gray-light">{service.type}</div>
        )}
      </div>
      <div className="ml-auto df ai-center">
        {service.port && (
          <CopyableText
            value={`localhost:${service.port}`}
            className="txt-md"
          />
        )}
        {service.state === 'connected' && (
          <DisconnectButtonController service={service} />
        )}
        {service.state === 'active' && (
          <ConnectButtonController service={service} />
        )}
      </div>
    </div>
  )
}
