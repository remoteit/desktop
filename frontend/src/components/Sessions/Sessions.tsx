import React from 'react'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Duration } from '../Duration'
import { Tooltip, IconButton } from '@material-ui/core'
import { colors, spacing, Color } from '../../styling'
import { Icon } from '../Icon'

interface Props {
  service?: IService
}

export const Sessions: React.FC<Props> = ({ service }) => {
  const css = useStyles()

  if (!service?.sessions?.length) return null

  return (
    <>
      {service.sessions.map((session, index) => (
        <Tooltip
          key={index}
          title={
            <>
              {session.email} connected <br /> <Duration startTime={session.timestamp.getTime()} ago />
            </>
          }
        >
          <IconButton>
            <Icon name="user" weight="light" size="md" fixedWidth />
          </IconButton>
        </Tooltip>
      ))}
    </>
  )
}

const useStyles = makeStyles({
  button: { padding: spacing.sm },
})
