import React from 'react'
import Controller from '../../services/Controller'
import { REGEX_FIRST_PATH } from '../../constants'
import { useLocation, useHistory } from 'react-router-dom'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

type Props = {
  connection?: IConnection
  disabled?: boolean
}

export const ForgetButton: React.FC<Props> = ({ disabled = false, connection }) => {
  const history = useHistory()
  const location = useLocation()

  if (!connection || connection.active) return null

  const forget = () => {
    Controller.emit('service/forget', connection)
    const menu = location.pathname.match(REGEX_FIRST_PATH)
    if (menu && menu[0] === '/connections') history.push('/connections')
  }

  return (
    <Tooltip title="Clear this connection">
      <IconButton disabled={disabled} onClick={forget}>
        <Icon name="times" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
