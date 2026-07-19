import React, { useState, useEffect } from 'react'
import { Box, List, ListItem, ListItemText, Collapse } from '@mui/material'
import { ConnectionErrorMenu } from '../ConnectionErrorMenu'
import { radius, spacing } from '../../styling'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { Gutters } from '../Gutters'

type Props = { connection?: IConnection; visible?: boolean }

export const ConnectionErrorMessage: React.FC<Props> = ({ connection, visible }) => {
  const dispatch = useDispatch<Dispatch>()
  const [hasError, setHasError] = useState<boolean>(!!connection?.error)

  useEffect(() => {
    // update device if new connection error
    if (connection?.error && connection?.deviceID && !hasError) {
      console.log('NEW CONNECTION ERROR - Load device')
      dispatch.devices.fetchDevices({ ids: [connection.deviceID], hidden: true })
      setHasError(true)
    }
  }, [connection?.error])

  if (!connection || !connection.error?.message) return null

  return (
    <Collapse in={visible}>
      <Gutters
        size="md"
        bottom={null}
        sx={{
          position: 'relative',
          backgroundColor: 'danger.main',
          borderRadius: `${radius.lg}px`,
          color: 'alwaysWhite.main',
          '& .MuiListItemSecondaryAction-root': { right: `${spacing.sm}px` },
          '& .MuiListItemText-secondary': { color: 'alwaysWhite.main' },
        }}
      >
        <Box
          component="span"
          sx={theme => ({
            position: 'absolute',
            top: -size + 1,
            left: 14,
            width: 0,
            height: 0,
            borderLeft: `${size}px solid transparent`,
            borderRight: `${size}px solid transparent`,
            borderBottom: `${size}px solid ${theme.palette.danger.main}`,
          })}
        />
        <List disablePadding>
          <ListItem>
            <ListItemText primary="Connection Error" secondary={connection.error.message} />
            <ConnectionErrorMenu connection={connection} />
          </ListItem>
        </List>
      </Gutters>
    </Collapse>
  )
}

const size = 9
