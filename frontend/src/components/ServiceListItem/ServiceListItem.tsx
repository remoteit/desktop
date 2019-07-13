import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ConnectedServiceItem } from '../ConnectedServiceItem'
import { IService } from 'remote.it'
import { connect } from 'react-redux'
import { ListItem } from '@material-ui/core'

export type ServiceListItemProps = {
  service: IService
} & ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({
  connect: dispatch.devices.connect,
})

export const ServiceListItem = connect(
  null,
  mapDispatch
)(({ connect, service }: ServiceListItemProps) => {
  if (service.state === 'connected') {
    return (
      <ConnectedServiceItem
        connection={{
          name: service.name,
          id: service.id,
          type: service.type,
          port: service.port,
          pid: service.pid,
        }}
      />
    )
  }

  return (
    <ListItem
      button
      className="df ai-center bb bc-gray-lighter"
      onClick={() => connect(service)}
    >
      <div className="mr-sm">
        <ConnectionStateIcon
          state={service.connecting ? 'connecting' : service.state}
          size="lg"
        />
      </div>
      <div>
        <div className="txt-md gray-darkest">{service.name}</div>
        {service.name.toLowerCase() !== service.type.toLowerCase() && (
          <div className="txt-sm gray">{service.type}</div>
        )}
      </div>
    </ListItem>
  )
})
