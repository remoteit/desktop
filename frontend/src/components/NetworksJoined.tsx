import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectNetworkByService } from '../models/networks'
import { makeStyles, List, ListSubheader, ListItemSecondaryAction } from '@material-ui/core'
import { NetworkListItem } from './NetworkListItem'
import { ConnectButton } from '../buttons/ConnectButton'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'
import { Title } from './Title'

export const NetworksJoined: React.FC<{ service?: IService; permissions?: IPermission[] }> = ({
  service,
  permissions,
}) => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const { networks } = useSelector((state: ApplicationState) => ({
    networks: selectNetworkByService(state, service?.id),
  }))

  if (!networks.length) return null

  return (
    <>
      <List className={css.list}>
        <ListSubheader>
          <Title>Networks</Title>
          <ConnectButton service={service} permissions={permissions} size="icon" icon="plus" />
        </ListSubheader>
        {networks.map(network => (
          <NetworkListItem title network={network}>
            <ListItemSecondaryAction>
              <IconButton
                icon="trash"
                onClick={() => dispatch.networks.remove({ serviceId: service?.id, networkId: network.id })}
              />
            </ListItemSecondaryAction>
          </NetworkListItem>
        ))}
      </List>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  list: {
    paddingTop: spacing.xs,
    paddingBottom: 0,
    '& .MuiListSubheader-root': {
      display: 'flex',
    },
  },
}))
