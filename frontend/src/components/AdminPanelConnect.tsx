import React from 'react'
import { Notice } from './Notice'
import { Columns } from './Columns'
import { ServiceListItem } from './ServiceListItem'
import { List, Typography, Divider } from '@material-ui/core'

export type Props = {
  device?: IDevice
  connections?: IConnection[]
}

export const AdminPanelConnect: React.FC<Props> = ({ device, connections }) => {
  const service = device?.services.find(s => s.typeID === 42 || s.port === 29999)

  if (!service) return null

  const messages = [
    'This device has additional options that can be accessed remotely via its admin panel.',
    "Access this device's full configuration options by connecting through its admin panel.",
  ]
  const message = messages[Math.floor(Math.random() * 2)]

  return (
    <>
      <List>
        <ServiceListItem
          connection={connections?.find(c => c.id === service.id)}
          service={service}
          secondary={message}
          indent
        />
      </List>
      <Divider />
    </>
  )
}
