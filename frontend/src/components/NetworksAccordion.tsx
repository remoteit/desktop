import React from 'react'
import { Chip, Box } from '@mui/material'
import { NetworksJoined } from './NetworksJoined'
import { getActiveAccountId } from '../models/accounts'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectNetworks, selectNetworkByService } from '../models/networks'
import { DynamicButtonMenu } from '../buttons/DynamicButtonMenu'
import { AccordionMenuItem } from './AccordionMenuItem'
import { TestUI } from './TestUI'
import { Notice } from './Notice'

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

  if (accessibleNetworks.length < 1) return null

  return (
    <TestUI>
      <AccordionMenuItem
        gutters
        subtitle="Networks"
        expanded={expanded}
        onClick={onClick}
        elevation={0}
        action={
          <Box display="flex" alignItems="center">
            {!!joinedNetworks.length && <Chip size="small" label={joinedNetworks.length.toLocaleString()} />}
            {device?.permissions.includes('MANAGE') && (
              <DynamicButtonMenu
                options={availableNetworks.map(n => ({ value: n.id, label: n.name }))}
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
                }}
              />
            )}
          </Box>
        }
      >
        {device?.permissions.includes('MANAGE') ? (
          <NetworksJoined service={service} networks={joinedNetworks} />
        ) : (
          <Notice severity="warning">You must be the owner or a manager of this device to add it to a network.</Notice>
        )}
      </AccordionMenuItem>
    </TestUI>
  )
}
