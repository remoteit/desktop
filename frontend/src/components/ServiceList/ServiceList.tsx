import React from 'react'
import { IService } from 'remote.it'
import { List } from '@material-ui/core'
import { ServiceListItem } from '../ServiceListItem'
// import styles from './ServiceList.module.css'

export interface Props {
  services: IService[]
}

export function ServiceList({ services }: Props) {
  return (
    <List component="nav" disablePadding>
      {services.map((service, key) => (
        <ServiceListItem service={service} key={key} />
      ))}
    </List>
  )
}
