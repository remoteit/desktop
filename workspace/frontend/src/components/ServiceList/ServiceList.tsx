import React from 'react'
import { List, Typography } from '@material-ui/core'
import { ServiceListItem } from '../ServiceListItem'
import { makeStyles } from '@material-ui/core/styles'
import { spacing } from '../../styling'
import { Body } from '../Body'

export interface ServiceListProps {
  services: IService[]
  connections: ConnectionLookup
}

export const ServiceList = ({ services = [], connections }: ServiceListProps) => {
  const css = useStyles()
  if (!services.length)
    return (
      <Body inset>
        <Typography variant="h2">No services</Typography>
      </Body>
    )
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
