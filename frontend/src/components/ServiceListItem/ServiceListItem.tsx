import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ConnectedServiceItem } from '../ConnectedServiceItem'
import { ConnectButtonController } from '../../controllers/ConnectButtonController'
import { IService } from 'remote.it'

export interface ServiceListItemProps {
  service: IService
}

export function ServiceListItem({ service }: ServiceListItemProps) {
  if (service.state === 'connected') {
    return (
      <ConnectedServiceItem
        connection={{
          serviceName: service.name,
          serviceID: service.id,
          type: service.type,
          port: service.port,
          pid: service.pid,
        }}
      />
    )
  }

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
        {service.state === 'active' && (
          <ConnectButtonController service={service} />
        )}
      </div>
    </div>
  )
}
