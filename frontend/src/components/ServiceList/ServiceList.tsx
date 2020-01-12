import React from 'react'
import { IService } from 'remote.it'
import { List, Typography } from '@material-ui/core'
import { ServiceListItem } from '../ServiceListItem'
import { spacing } from '../../styling'
import { makeStyles } from '@material-ui/styles'

export interface ServiceListProps {
  services: IService[]
  connections: ConnectionLookup
}

export const ServiceList = ({ services = [], connections }: ServiceListProps) => {
  const css = useStyles()
  if (!services.length) return <Typography variant="h1">No services</Typography>
  return (
    <List className={css.list}>
      {services.map((service, key) => (
        <ServiceListItem connection={connections[service.id]} service={service} key={key} indent />
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  list: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
})
