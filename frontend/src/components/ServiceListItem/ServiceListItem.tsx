import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ConnectedServiceItem } from '../ConnectedServiceItem'
import { IService } from 'remote.it'
import { connect } from 'react-redux'
import { ListItem } from '@material-ui/core'
import { ApplicationState } from '../../store'

const mapState = (state: ApplicationState, props: { service: IService }) => ({
  connection: state.devices.connections.find(c => c.id === props.service.id),
})

const mapDispatch = (dispatch: any) => ({
  connect: dispatch.devices.connect,
})

export type ServiceListItemProps = {
  service: IService
} & ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>

export const ServiceListItem = connect(
  mapState,
  mapDispatch
)(({ connect, connection, service }: ServiceListItemProps) => {
  if (service.state === 'connected' && connection) {
    return <ConnectedServiceItem connection={connection} />
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
