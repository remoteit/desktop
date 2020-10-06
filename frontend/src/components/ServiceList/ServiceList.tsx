import React from 'react'
import { List, Typography } from '@material-ui/core'
import { ServiceListItem } from '../ServiceListItem'
import { makeStyles } from '@material-ui/core/styles'
import { spacing } from '../../styling'

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
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
})
