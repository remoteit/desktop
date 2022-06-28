import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@mui/styles'
import { Typography, List, ListItemSecondaryAction } from '@mui/material'
import { NetworkListTitle } from './NetworkListTitle'
import { ClearButton } from '../buttons/ClearButton'
import { Gutters } from './Gutters'
import { spacing } from '../styling'

export const NetworksJoined: React.FC<{ service?: IService; networks: INetwork[] }> = ({ service, networks }) => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()

  if (!networks.length)
    return (
      <Gutters top="sm" bottom="sm">
        <Typography variant="body2" color="textSecondary">
          None
        </Typography>
      </Gutters>
    )

  return (
    <List className={css.list}>
      {networks.map(network => (
        <NetworkListTitle key={network.id} network={network}>
          <ListItemSecondaryAction>
            <ClearButton onClick={() => dispatch.networks.remove({ serviceId: service?.id, networkId: network.id })} />
          </ListItemSecondaryAction>
        </NetworkListTitle>
      ))}
    </List>
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
