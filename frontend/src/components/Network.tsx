import React, { useState } from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { ClearButton } from '../buttons/ClearButton'
import { NetworkListItem } from './NetworkListItem'
import { NetworkListTitle } from './NetworkListTitle'
import { Typography, Collapse, List, ListItem, ListItemIcon } from '@mui/material'

export interface Props {
  network?: INetwork
  clear?: boolean
}

export const Network: React.FC<Props> = ({ clear, ...props }) => {
  const dispatch = useDispatch<Dispatch>()
  const [expanded, setExpanded] = useState<boolean>(true)
  return (
    <List>
      <NetworkListTitle {...props} expanded={expanded}>
        <IconButton
          icon={expanded ? 'caret-down' : 'caret-up'}
          onClick={() => setExpanded(!expanded)}
          type="solid"
          size="sm"
        />
      </NetworkListTitle>
      <Collapse in={expanded}>
        {props.network?.serviceIds.map(id => (
          <NetworkListItem serviceId={id} key={id} {...props}>
            {clear && <ClearButton id={id} onClick={() => dispatch.connections.clear(id)} />}
          </NetworkListItem>
        ))}
        {!props.network?.serviceIds.length && (
          <ListItem>
            <ListItemIcon />
            <Typography variant="caption">No Services</Typography>
          </ListItem>
        )}
      </Collapse>
    </List>
  )
}
