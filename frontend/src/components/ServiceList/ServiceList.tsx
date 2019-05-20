import React from 'react'
import { IService } from 'remote.it'
import { ServiceListItem } from '../ServiceListItem'

export interface ServiceListProps {
  services: IService[]
}

export function ServiceList({ services = [] }: ServiceListProps) {
  return (
    <>
      {services.length ? (
        services.map((service, key) => (
          <ServiceListItem service={service} key={key} />
        ))
      ) : (
        <div className="px-md py-sm italic gray-dark">
          No services to show...
        </div>
      )}
    </>
  )
}
