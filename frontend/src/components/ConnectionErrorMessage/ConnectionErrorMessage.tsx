import React from 'react'
import { useHistory } from 'react-router'
import { makeStyles } from '@material-ui/styles'
import { clearConnectionError } from '../../helpers/connectionHelper'
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Button,
  Collapse,
} from '@material-ui/core'
import { IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import styles from '../../styling'

type Props = { connection?: IConnection; service?: IService; visible?: boolean }

export const ConnectionErrorMessage: React.FC<Props> = ({ connection, service, visible }) => {
  const css = useStyles()
  const history = useHistory()

  const viewLog = () => {
    const deviceID = (service && service.deviceID) || (connection && connection.deviceID)
    const serviceID = (service && service.id) || (connection && connection.id)
    history.push(`/devices/${deviceID}/${serviceID}/log`)
  }

  if (!connection || !connection.error) return null

  return (
    <Collapse in={visible}>
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
        <ListItemSecondaryAction>
          <Button onClick={viewLog} size="small">
            View Log
          </Button>
        </ListItemSecondaryAction>
      </ListItem>
    </Collapse>
  )
}

const size = 8

const useStyles = makeStyles({
  container: {
    backgroundColor: styles.colors.danger,
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
    borderBottom: `${size}px solid ${styles.colors.danger}`,
  },
})
