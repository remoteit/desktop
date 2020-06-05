import React from 'react'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import {
  makeStyles,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
} from '@material-ui/core'
import { Duration } from '../Duration'
import { spacing } from '../../styling'
import { Columns } from '../Columns'
import { Icon } from '../Icon'

interface Props {
  service?: IService
}

export const Sessions: React.FC<Props> = ({ service }) => {
  const user = useSelector((state: ApplicationState) => state.auth.user)
  const css = useStyles()

  if (!service?.sessions?.length) return null

  return (
    <>
      <List>
        {service.sessions.map((session, index) => (
          <ListItem>
            <ListItemIcon>
              <Icon name="user" weight="light" size="md" fixedWidth />
            </ListItemIcon>
            <ListItemText
              primary={`${session.email} connected`}
              secondary={<Duration startTime={session.timestamp.getTime()} ago />}
            />
          </ListItem>
        ))}
      </List>
      <Divider />
    </>
  )
}

const useStyles = makeStyles({
  button: { padding: spacing.sm },
  label: { marginLeft: spacing.xs },
})
