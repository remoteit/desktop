import React from 'react'
import { IService } from 'remote.it'

import { ServiceListItem } from '../ServiceListItem'
import { ConnectedServiceItem } from '../ConnectedServiceItem'

export interface ServiceListProps {
  services: IService[]
  connections: ConnectionLookup
}

export const ServiceList = ({ services = [], connections }: ServiceListProps) => {
  if (!services.length) return <div className="px-md py-sm gray-dark">No services to show...</div>

  return (
    <>
      {services.map((service, key) =>
        service.id && !!connections[service.id] ? (
          <ConnectedServiceItem connection={connections[service.id]} key={key} />
        ) : (
          <ServiceListItem service={service} key={key} />
        )
      )}
    </>
  )
}
