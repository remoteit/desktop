import React, { useState, useEffect } from 'react'
import { List, ListItem, ListItemText, Collapse } from '@mui/material'
import { ConnectionErrorMenu } from '../ConnectionErrorMenu'
import { radius, spacing } from '../../styling'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@mui/styles'
import { Dispatch } from '../../store'
import { Gutters } from '../Gutters'

type Props = { connection?: IConnection; visible?: boolean }

export const ConnectionErrorMessage: React.FC<Props> = ({ connection, visible }) => {
  const dispatch = useDispatch<Dispatch>()
  const [hasError, setHasError] = useState<boolean>(!!connection?.error)
  const css = useStyles()

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
      <Gutters size="md" bottom={null} className={css.container}>
        <span className={css.pointer} />
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

const useStyles = makeStyles(({ palette }) => ({
  container: {
    position: 'relative',
    backgroundColor: palette.danger.main,
    borderRadius: radius.lg,
    color: palette.alwaysWhite.main,
    '& .MuiListItemSecondaryAction-root': { right: spacing.sm },
    '& .MuiListItemText-secondary': { color: palette.alwaysWhite.main },
  },
  pointer: {
    position: 'absolute',
    top: -size + 1,
    left: 14,
    width: 0,
    height: 0,
    borderLeft: `${size}px solid transparent`,
    borderRight: `${size}px solid transparent`,
    borderBottom: `${size}px solid ${palette.danger.main}`,
  },
}))
