import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../components/Icon'

type Props = {
  onClick?: () => void
}

export const EditButton: React.FC<Props> = ({ onClick }) => {
  return (
    <Tooltip title="Edit">
      <IconButton onClick={() => onClick && onClick()}>
        <Icon name="pencil" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
