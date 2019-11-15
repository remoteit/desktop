import React from 'react'
import { IService } from 'remote.it'
import { List, Typography } from '@material-ui/core'
import { ServiceListItem } from '../ServiceListItem'

export interface ServiceListProps {
  services: IService[]
  connections: ConnectionLookup
}

export const ServiceList = ({ services = [], connections }: ServiceListProps) => {
  if (!services.length) return <Typography variant="subtitle1">No services.</Typography>

  return (
    <List>
      {services.map((service, key) => (
        <ServiceListItem connection={connections[service.id]} service={service} key={key} />
      ))}
    </List>
  )
}
