import React from 'react'
import { makeStyles } from '@mui/styles'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { clearConnectionError } from '../../helpers/connectionHelper'
import { List, ListItem, ListItemSecondaryAction, ListItemText, Collapse } from '@mui/material'
import { IconButton } from '../../buttons/IconButton'
import { Gutters } from '../Gutters'
import { radius, spacing } from '../../styling'

type Props = { connection?: IConnection; visible?: boolean }

export const ConnectionErrorMessage: React.FC<Props> = ({ connection, visible }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()

  if (!connection || !connection.error?.message) return null

  return (
    <Collapse in={visible}>
      <Gutters size="md" bottom={null} className={css.container}>
        <span className={css.pointer} />
        <List disablePadding>
          <ListItem>
            <ListItemText primary="Connection Error" secondary={connection.error.message} />
            <ListItemSecondaryAction>
              <IconButton
                title="Report Issue"
                name="flag"
                color="alwaysWhite"
                onClick={async () => {
                  await dispatch.feedback.set({
                    subject: `Connection Issue Report for ${connection?.name}`,
                    data: connection,
                  })
                  history.push('/feedback')
                }}
                size="base"
              />
              <IconButton
                title="Clear"
                name="times"
                color="alwaysWhite"
                onClick={() => clearConnectionError(connection)}
                size="md"
              />
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
