import React from 'react'
import { makeStyles } from '@mui/styles'
import { clearConnectionError } from '../../helpers/connectionHelper'
import { List, ListItem, ListItemSecondaryAction, ListItemText, Tooltip, Collapse } from '@mui/material'
import { IconButton } from '@mui/material'
import { Gutters } from '../Gutters'
import { Icon } from '../Icon'
import { radius, spacing } from '../../styling'

type Props = { connection?: IConnection; service?: IService; visible?: boolean }

export const ConnectionErrorMessage: React.FC<Props> = ({ connection, service, visible }) => {
  const css = useStyles()

  if (!connection || !connection.error?.message) return null

  return (
    <Collapse in={visible}>
      <Gutters size="md" bottom={null} className={css.container}>
        <span className={css.pointer} />
        <List disablePadding>
          <ListItem>
            <ListItemText
              primary="Connection Error"
              secondary={connection.error.message + (connection.error.code ? ` (CODE: ${connection.error.code})` : '')}
            />
            <ListItemSecondaryAction>
              <Tooltip title="clear">
                <IconButton onClick={() => clearConnectionError(connection)} size="large">
                  <Icon name="times" color="alwaysWhite" size="md" fixedWidth />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Gutters>
    </Collapse>
  )
}

const size = 8

const useStyles = makeStyles(({ palette }) => ({
  container: {
    position: 'relative',
    backgroundColor: palette.danger.main,
    borderRadius: radius,
    color: palette.alwaysWhite.main,
    '& .MuiListItemSecondaryAction-root': { right: spacing.sm },
    '& .MuiListItemText-secondary': { color: palette.alwaysWhite.main },
  },
  pointer: {
    position: 'absolute',
    top: -size,
    left: 14,
    width: 0,
    height: 0,
    borderLeft: `${size}px solid transparent`,
    borderRight: `${size}px solid transparent`,
    borderBottom: `${size}px solid ${palette.danger.main}`,
  },
}))
