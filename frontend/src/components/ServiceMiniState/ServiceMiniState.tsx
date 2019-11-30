import React from 'react'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/styles'
import { IService, IDevice } from 'remote.it'
import { Tooltip, IconButton } from '@material-ui/core'
import { colors, spacing, Color } from '../../styling'

interface Props {
  connection?: IConnection
  service?: IService | IDevice
  pathname: string
}

export const ServiceMiniState: React.FC<Props> = ({ connection, service, pathname }) => {
  const history = useHistory()
  const css = useStyles()

  let colorName: Color = 'warning'
  let state = service ? service.state : 'unknown'

  if (connection) {
    if (connection.pid && !connection.active) state = 'connecting'
    if (connection.active) state = 'connected'
  }

  switch (state) {
    case 'active':
      colorName = 'success'
      break
    case 'inactive':
      colorName = 'grayLight'
      break
    case 'connected':
      colorName = 'primary'
      break
    case 'connecting':
      colorName = 'grayLight'
      break
    case 'restricted':
      colorName = 'danger'
      break
    case 'unknown':
      colorName = 'grayLight'
  }

  return (
    <Tooltip title={service ? `${service.name} - ${state}` : state}>
      <IconButton className={css.button} onClick={() => history.push(pathname)}>
        <span style={{ backgroundColor: colors[colorName] }} />
      </IconButton>
    </Tooltip>
  )
}

const useStyles = makeStyles({
  button: {
    padding: `9px 0`,
    '& > span > span': {
      height: 2,
      borderRadius: 2,
      width: spacing.md,
      display: 'inline-block',
      marginLeft: 2,
      marginRight: 2,
    },
  },
})
