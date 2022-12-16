import React from 'react'
import { Chip, Box, Tooltip } from '@mui/material'
import { NetworksJoined } from './NetworksJoined'
import { getActiveAccountId } from '../selectors/accounts'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectNetworkByService } from '../models/networks'
import { selectNetworks } from '../selectors/networks'
import { NetworksAddMenu } from './NetworkAddMenu'
import { AccordionMenuItem } from './AccordionMenuItem'
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
  const { ownerId, allNetworks, joinedNetworks } = useSelector((state: ApplicationState) => ({
    ownerId: getActiveAccountId(state),
    allNetworks: selectNetworks(state),
    joinedNetworks: selectNetworkByService(state, connection.id),
  }))
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
                  color: n.enabled ? 'primary' : undefined,
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
                  {!instance?.permissions.includes('MANAGE') && 'You are not a manager of this device.'}
                  {instance?.shared && 'You can not add a device shared to you.'}
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
