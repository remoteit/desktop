import React from 'react'
import { clearConnectionError } from '../../helpers/connectionHelper'
import { makeStyles } from '@material-ui/styles'
import { ListItem, ListItemIcon, ListItemText, Tooltip } from '@material-ui/core'
import { IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import styles from '../../styling'

export const ConnectionErrorMessage: React.FC<{ connection?: IConnection }> = ({ connection }) => {
  const css = useStyles()
  if (!connection || !connection.error) return null

  return (
    <ListItem className={css.container}>
      <span className={css.pointer} />
      <ListItemIcon>
        <Tooltip title="clear">
          <IconButton onClick={() => clearConnectionError(connection)}>
            <Icon name="times" color="white" size="md" fixedWidth />
          </IconButton>
        </Tooltip>
      </ListItemIcon>
      <ListItemText
        secondary={connection.error.message + (connection.error.code ? ` (CODE: ${connection.error.code})` : '')}
      >
        Connection Error
      </ListItemText>
    </ListItem>
  )
}

const size = 8

const useStyles = makeStyles({
  container: {
    backgroundColor: styles.colors.warning,
    color: styles.colors.white,
    '& .MuiListItemText-secondary': { color: styles.colors.white },
  },
  pointer: {
    position: 'absolute',
    top: -size,
    left: 32,
    width: 0,
    height: 0,
    borderLeft: `${size}px solid transparent`,
    borderRight: `${size}px solid transparent`,
    borderBottom: `${size}px solid ${styles.colors.warning}`,
  },
})
