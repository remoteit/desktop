import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { makeStyles, List, ListItemSecondaryAction } from '@material-ui/core'
import { NetworkListItem } from './NetworkListItem'
import { ClearButton } from '../buttons/ClearButton'

import { spacing } from '../styling'

export const NetworksJoined: React.FC<{ service?: IService; networks: INetwork[] }> = ({ service, networks }) => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()

  if (!networks.length) return null

  return (
    <>
      <List className={css.list}>
        {networks.map(network => (
          <NetworkListItem key={network.id} title network={network}>
            <ListItemSecondaryAction>
              <ClearButton
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
    '& .MuiListSubheader-root': { display: 'flex' },
    '& .MuiListItemSecondaryAction-root': { right: spacing.md },
  },
}))
