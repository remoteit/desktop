import React from 'react'
import { List, Typography, Divider } from '@material-ui/core'
import { ServiceListItem } from '../ServiceListItem'
import { spacing } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'

export interface ServiceListProps {
  services: IService[]
  connections: ConnectionLookup
}

export const ServiceList = ({ services = [], connections }: ServiceListProps) => {
  const css = useStyles()
  if (!services.length) return <Typography variant="h1">No services</Typography>
  return (
    <>
      <List className={css.list}>
        {services.map((service, key) => (
          <ServiceListItem connection={connections[service.id]} service={service} key={key} indent />
        ))}
      </List>
      <Divider />
    </>
  )
}

const useStyles = makeStyles({
  list: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
})
