import React from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const AddUserButton: React.FC<{ device?: IDevice }> = ({ device }) => {
  const location = useLocation()
  const history = useHistory()
  const onClick = () => history.push(`${location.pathname}/share`)

  if (device?.shared) return null

  return (
    <Tooltip title="Share">
      <IconButton onClick={onClick}>
        <Icon name="user-plus" size="md" type="light" />
      </IconButton>
    </Tooltip>
  )
}
