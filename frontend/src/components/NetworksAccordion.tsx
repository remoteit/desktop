import React from 'react'
import { Chip, Box } from '@mui/material'
import { NetworksJoined } from './NetworksJoined'
import { getActiveAccountId } from '../models/accounts'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectNetworks, selectNetworkByService } from '../models/networks'
import { DynamicButtonMenu } from '../buttons/DynamicButtonMenu'
import { AccordionMenuItem } from './AccordionMenuItem'

type Props = {
  expanded: boolean
  device?: IDevice
  service?: IService
  connection: IConnection
  onClick: () => void
}

export const NetworksAccordion: React.FC<Props> = ({ expanded, device, service, connection, onClick }) => {
  const dispatch = useDispatch<Dispatch>()
  const { ownerId, allNetworks, joinedNetworks } = useSelector((state: ApplicationState) => ({
    ownerId: getActiveAccountId(state),
    allNetworks: selectNetworks(state),
    joinedNetworks: selectNetworkByService(state, connection.id),
  }))
  const accessibleNetworks = allNetworks.filter(n => n.owner.id === ownerId)
  const availableNetworks = accessibleNetworks.filter(n => !joinedNetworks.find(j => j.id === n.id))

  console.log({ accessibleNetworks, availableNetworks, allNetworks, joinedNetworks })

  if (accessibleNetworks.length < 1 || !device?.permissions.includes('MANAGE') || ownerId !== device.owner.id)
    return null

  return (
    <AccordionMenuItem
      gutters
      subtitle="Networks"
      expanded={expanded}
      onClick={onClick}
      elevation={0}
      action={
        <Box display="flex" alignItems="center">
          {!!joinedNetworks.length && <Chip size="small" label={joinedNetworks.length.toLocaleString()} />}
          <DynamicButtonMenu
            options={accessibleNetworks.map(n => ({ value: n.id, label: n.name }))}
            title={
              accessibleNetworks.length === 1
                ? `Add to ${accessibleNetworks[0].name}`
                : !accessibleNetworks.length
                ? 'No available networks'
                : 'Add to network'
            }
            size="icon"
            icon="plus"
            disabled={!availableNetworks.length}
            onClick={networkId => {
              if (!service) return
              dispatch.networks.add({
                networkId,
                serviceId: service.id,
                name: connection.name,
                port: connection.port,
                enabled: connection.enabled,
              })
              dispatch.ui.accordion({ networks: true })
            }}
          />
        </Box>
      }
    >
      <NetworksJoined service={service} networks={joinedNetworks} />
    </AccordionMenuItem>
  )
}
