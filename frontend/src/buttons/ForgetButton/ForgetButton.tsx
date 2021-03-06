import React from 'react'
import { emit } from '../../services/Controller'
import { connectionState } from '../../helpers/connectionHelper'
import { REGEX_FIRST_PATH } from '../../shared/constants'
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
  const state = connectionState(undefined, connection)

  if (state === 'connected') return null

  const forget = () => {
    emit('service/forget', connection)
    const menu = location.pathname.match(REGEX_FIRST_PATH)
    if (menu && menu[0] === '/connections') history.push('/connections')
  }

  return (
    <Tooltip title="Reset connection settings">
      <IconButton disabled={disabled} onClick={forget}>
        <Icon name="undo" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
