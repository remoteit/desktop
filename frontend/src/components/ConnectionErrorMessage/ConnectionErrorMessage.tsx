import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { clearConnectionError } from '../../helpers/connectionHelper'
import { ListItem, ListItemSecondaryAction, ListItemText, Tooltip, Collapse } from '@material-ui/core'
import { IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import { spacing } from '../../styling'

type Props = { connection?: IConnection; service?: IService; visible?: boolean }

export const ConnectionErrorMessage: React.FC<Props> = ({ connection, service, visible }) => {
  const css = useStyles()

  if (!connection || !connection.error?.message) return null

  return (
    <Collapse in={visible}>
      <ListItem className={css.container}>
        <span className={css.pointer} />
        <ListItemText
          primary="Connection Error"
          secondary={connection.error.message + (connection.error.code ? ` (CODE: ${connection.error.code})` : '')}
        />
        <ListItemSecondaryAction>
          <Tooltip title="clear">
            <IconButton onClick={() => clearConnectionError(connection)}>
              <Icon name="times" color="white" size="md" fixedWidth />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      </ListItem>
    </Collapse>
  )
}

const size = 8

const useStyles = makeStyles(({ palette }) => ({
  container: {
    backgroundColor: palette.danger.main,
    paddingLeft: spacing.xl,
    color: palette.white.main,
    '& .MuiListItemText-secondary': { color: palette.white.main },
  },
  pointer: {
    position: 'absolute',
    top: -size,
    left: 32,
    width: 0,
    height: 0,
    borderLeft: `${size}px solid transparent`,
    borderRight: `${size}px solid transparent`,
    borderBottom: `${size}px solid ${palette.danger.main}`,
  },
}))
