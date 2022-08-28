import React from 'react'
import { Chip, Box, Tooltip } from '@mui/material'
import { NetworksJoined } from './NetworksJoined'
import { getActiveAccountId } from '../models/accounts'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectNetworks, selectNetworkByService } from '../models/networks'
import { DynamicButtonMenu } from '../buttons/DynamicButtonMenu'
import { AccordionMenuItem } from './AccordionMenuItem'
import { TestUI } from './TestUI'
import { Icon } from './Icon'

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
        expanded={joinedNetworks.length ? expanded : false}
        onClick={onClick}
        disabled={!joinedNetworks.length}
        elevation={0}
        action={
          <Box display="flex" alignItems="center">
            {device?.permissions.includes('MANAGE') && !device.shared ? (
              <>
                <Chip size="small" label={joinedNetworks.length ? joinedNetworks.length.toLocaleString() : 'None'} />
                <DynamicButtonMenu
                  options={availableNetworks.map(n => ({
                    value: n.id,
                    label: n.name,
                    color: n.enabled ? 'primary' : undefined,
                  }))}
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
                    dispatch.connections.enable({ connection, networkId })
                  }}
                />
              </>
            ) : (
              <Tooltip
                title={
                  <>
                    You must be the device owner or
                    <br />
                    manager to add it to a network.
                  </>
                }
                placement="left"
                arrow
              >
                <Icon name="ban" color="grayDark" type="solid" inlineLeft />
              </Tooltip>
            )}
          </Box>
        }
      >
        <NetworksJoined service={service} networks={joinedNetworks} />
      </AccordionMenuItem>
    </TestUI>
  )
}
