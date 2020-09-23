import React from 'react'
import { emit } from '../../services/Controller'
import { REGEX_FIRST_PATH } from '../../shared/constants'
import { useLocation, useHistory } from 'react-router-dom'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

type Props = {
  connection?: IConnection
  disabled?: boolean
  all?: boolean
}

export const ForgetButton: React.FC<Props> = ({ disabled = false, connection, all }) => {
  const history = useHistory()
  const location = useLocation()

  if (!all && (!connection || connection.active)) return null

  const forget = () => {
    emit(all ? 'service/clear-recent' : 'service/forget', connection)
    const menu = location.pathname.match(REGEX_FIRST_PATH)
    if (menu && menu[0] === '/connections') history.push('/connections')
  }

  return (
    <Tooltip title={all ? 'Clear all connections' : 'Clear this connection'}>
      <IconButton disabled={disabled} onClick={forget}>
        <Icon name="times-circle" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
