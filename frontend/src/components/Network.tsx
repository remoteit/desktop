import React from 'react'
import { IconButton } from '../buttons/IconButton'
import { ClearButton } from '../buttons/ClearButton'
import { NetworkListTitle } from './NetworkListTitle'
import { NetworkServicesList } from './NetworkServicesList'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { selectConnectionSessions, selectConnections } from '../selectors/connections'
import { Collapse, List } from '@mui/material'
import { spacing, radius, fontSizes } from '../styling'
import { makeStyles } from '@mui/styles'
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
  const css = useStyles({ highlight })

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
    <List className={css.list}>
      <NetworkListTitle
        network={network}
        enabled={networkConnected || networkEnabled}
        noLink={connectionsPage}
        expanded={expanded}
        offline={recent}
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

const useStyles = makeStyles(({ palette }) => ({
  list: ({ highlight }: Props) =>
    highlight
      ? {
          backgroundColor: highlight ? palette.primaryHighlight.main : undefined,
          margin: spacing.md,
          borderRadius: radius.sm,
          '& .MuiListItem-root': {
            width: `calc(100% - ${spacing.lg}px)`,
            marginLeft: spacing.sm,
          },
          '& .MuiListItemIcon-root:first-of-type': {
            marginLeft: -spacing.sm,
          },
          '& .MuiListItem-button': {
            '&:hover,&:focus,&.Mui-selected': {
              backgroundColor: palette.white.main,
            },
          },
          '& .Mui-selected': {
            backgroundColor: palette.white.main,
          },
        }
      : {},
  note: {
    color: palette.primary.main,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    fontWeight: 500,
    fontSize: fontSizes.xxxs,
    marginRight: spacing.sm,
  },
}))
