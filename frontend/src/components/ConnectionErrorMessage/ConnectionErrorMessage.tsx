import React from 'react'
import { clearConnectionError } from '../../helpers/connectionHelper'
import { makeStyles } from '@material-ui/styles'
import { ListItem, ListItemIcon, ListItemText, Tooltip } from '@material-ui/core'
import { IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import styles from '../../styling'

type ConnectionErrorMessageProps = {
  connection: IConnection
}

export const ConnectionErrorMessage = ({ connection }: ConnectionErrorMessageProps) => {
  const css = useStyles()
  if (!connection.error) return null

  // Don't show an error if the process was killed by the user.
  if (connection.error.code === 3) return null

  return (
    <ListItem className={css.container}>
      <ListItemIcon>
        <Tooltip title="clear">
          <IconButton onClick={() => clearConnectionError(connection)}>
            <Icon name="times" color="white" size="md" fixedWidth />
          </IconButton>
        </Tooltip>
      </ListItemIcon>
      <ListItemText
        secondary={
          connection.error.message +
          ' (' +
          (connection.error.code ? `CODE: ${connection.error.code}` : 'Failed to connect.') +
          ')'
        }
      >
        Connection Error
      </ListItemText>
    </ListItem>
  )
}

const useStyles = makeStyles({
  container: {
    backgroundColor: styles.colors.danger,
    color: styles.colors.white,
    '& .MuiListItemText-secondary': { color: styles.colors.white },
  },
})
