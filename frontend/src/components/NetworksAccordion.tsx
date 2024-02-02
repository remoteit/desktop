import React from 'react'
import { NetworksJoined } from './NetworksJoined'
import { selectActiveAccountId } from '../selectors/accounts'
import { useSelector, useDispatch } from 'react-redux'
import { selectNetworks, selectNetworkByService } from '../selectors/networks'
import { Chip, Box, Tooltip } from '@mui/material'
import { AccordionMenuItem } from './AccordionMenuItem'
import { State, Dispatch } from '../store'
import { NetworksAddMenu } from './NetworkAddMenu'
import { Icon } from './Icon'

type Props = {
  expanded: boolean
  instance?: IInstance
  service?: IService
  connection: IConnection
  onClick: () => void
}

export const NetworksAccordion: React.FC<Props> = ({ expanded, instance, service, connection, onClick }) => {
  const dispatch = useDispatch<Dispatch>()
  const ownerId = useSelector(selectActiveAccountId)
  const allNetworks = useSelector(selectNetworks)
  const joinedNetworks = useSelector((state: State) => selectNetworkByService(state, connection.id))
  const accessibleNetworks = allNetworks.filter(n => n.owner.id === ownerId)

  return (
    <AccordionMenuItem
      gutters
      subtitle="Networks"
      expanded={joinedNetworks.length ? expanded : false}
      onClick={onClick}
      disabled={!joinedNetworks.length}
      elevation={0}
      action={
        <Box display="flex" alignItems="center">
          {instance?.permissions.includes('MANAGE') && !instance.shared ? (
            <>
              {!!joinedNetworks.length && <Chip size="small" label={joinedNetworks.length.toLocaleString()} />}
              <NetworksAddMenu
                options={accessibleNetworks.map(n => ({
                  value: n.id,
                  label: n.name,
                  disabled: !!joinedNetworks.some(j => j.id === n.id),
                }))}
                title={!accessibleNetworks.length ? 'Add a network' : 'Connect to network'}
                size="icon"
                icon="plus"
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
            </>
          ) : (
            <Tooltip
              title={
                <>
                  {!instance?.permissions.includes('MANAGE') &&
                    'You must be the device owner or manager to modify the networks of this service.'}
                  {instance?.shared && 'You can not modify the networks of a device shared to you.'}
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
  )
}
