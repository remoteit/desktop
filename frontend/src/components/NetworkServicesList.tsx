import React, { useState } from 'react'
import { ListItem, ListItemIcon, Typography, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import { NetworkListItem } from './NetworkListItem'
import { ClearButton } from '../buttons/ClearButton'

export interface NetworkServicesListProps {
  serviceIds: string[]
  network: INetwork
  networkConnected: boolean
  networkEnabled: boolean
  sessions: ISession[]
  connectionsPage?: boolean
  onClear?: (serviceId: string) => void
  initialDisplayCount?: number
  incrementCount?: number
}

export const NetworkServicesList: React.FC<NetworkServicesListProps> = ({
  serviceIds,
  network,
  networkConnected,
  networkEnabled,
  sessions,
  connectionsPage,
  onClear,
  initialDisplayCount = 10,
  incrementCount = 10,
}) => {
  const [displayCount, setDisplayCount] = useState(initialDisplayCount)
  const hasMore = displayCount < serviceIds.length
  const displayedServices = serviceIds.slice(0, displayCount)

  if (!serviceIds.length) {
    return (
      <ListItem>
        <ListItemIcon />
        <Typography variant="caption">
          Add services through the <Link to="/devices">device list</Link>
        </Typography>
      </ListItem>
    )
  }

  return (
    <>
      {displayedServices.map(id => (
        <NetworkListItem
          key={id}
          serviceId={id}
          network={network}
          enabled={networkConnected || networkEnabled}
          session={connectionsPage ? undefined : sessions.find(s => s.target.id === id)}
          fallbackName={network.connectionNames[id]}
          connectionsPage={connectionsPage}
        >
          {onClear && <ClearButton id={id} onClick={() => onClear(id)} className="hidden" />}
        </NetworkListItem>
      ))}

      {hasMore && (
        <ListItem>
          <ListItemIcon />
          <Button
            size="small"
            variant="text"
            onClick={() => setDisplayCount(prev => Math.min(prev + incrementCount, serviceIds.length))}
          >
            Show more
          </Button>
          <Typography variant="caption" flexGrow={1} textAlign="right" marginRight={2} color="gray.main">
            {displayCount} of {serviceIds.length}
          </Typography>
        </ListItem>
      )}
    </>
  )
}
