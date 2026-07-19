import React from 'react'
import { IconButton } from '../buttons/IconButton'
import { ClearButton } from '../buttons/ClearButton'
import { NetworkListTitle } from './NetworkListTitle'
import { NetworkServicesList } from './NetworkServicesList'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { selectConnectionSessions, selectConnections } from '../selectors/connections'
import { Collapse, List } from '@mui/material'
import { spacing, radius } from '../styling'
import { Tags } from './Tags'

export interface Props {
  network?: INetwork
  recent?: boolean
  connectionsPage?: boolean
  highlight?: boolean
  onClear?: (serviceId: string) => void
}

export const Network: React.FC<Props> = ({ onClear, recent, highlight, network, connectionsPage }) => {
  const dispatch = useDispatch<Dispatch>()
  const collapsed = useSelector((state: State) => state.ui.collapsed)
  const sessions = useSelector((state: State) => selectConnectionSessions(state))
  const networkEnabled = useSelector((state: State) =>
    selectConnections(state).some(c => c.enabled && network?.serviceIds.includes(c.id))
  )
  if (!network?.id) return null

  const networkConnected = sessions.some(s => network?.serviceIds.includes(s.target.id))
  const expanded = !collapsed.includes(network.id)
  const toggle = (event: React.MouseEvent) => {
    event.stopPropagation()
    const updated = [...collapsed]
    if (expanded) updated.push(network.id)
    else updated.splice(updated.indexOf(network.id), 1)
    dispatch.ui.set({ collapsed: updated })
  }

  return (
    <List
      sx={
        highlight
          ? theme => ({
              backgroundColor: theme.palette.primaryHighlight.main,
              margin: `${spacing.md}px`,
              borderRadius: `${radius.sm}px`,
              '& .MuiListItem-root': {
                width: `calc(100% - ${spacing.lg}px)`,
                marginLeft: `${spacing.sm}px`,
              },
              '& .MuiListItemIcon-root:first-of-type': {
                marginLeft: `${-spacing.sm}px`,
              },
              '& .MuiListItem-button': {
                '&:hover,&:focus,&.Mui-selected': {
                  backgroundColor: theme.palette.white.main,
                },
              },
              '& .MuiListItemButton-root.Mui-selected': {
                backgroundColor: theme.palette.white.main,
              },
            })
          : undefined
      }
    >
      <NetworkListTitle
        network={network}
        enabled={networkConnected || networkEnabled}
        noLink={connectionsPage}
        expanded={expanded}
        onClick={toggle}
      >
        {recent && <ClearButton all onClick={() => dispatch.connections.clearRecent()} />}
        <Tags tags={network?.tags || []} max={0} small />
        <IconButton
          onClick={toggle}
          name={expanded ? 'caret-down' : 'caret-up'}
          color={highlight ? 'primary' : 'grayDark'}
          disabled={connectionsPage}
          hideDisableFade
          buttonBaseSize="small"
          type="solid"
          size="sm"
        />
      </NetworkListTitle>
      <Collapse in={expanded}>
        <NetworkServicesList
          serviceIds={network?.serviceIds || []}
          network={network}
          networkConnected={networkConnected}
          networkEnabled={networkEnabled}
          sessions={sessions}
          connectionsPage={connectionsPage}
          onClear={onClear}
        />
      </Collapse>
    </List>
  )
}
