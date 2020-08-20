import React from 'react'
import { IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const AddUserButton: React.FC<{ onAddUserClick: () => void }> = ({ onAddUserClick }) => {
  return (
      <IconButton onClick={onAddUserClick}>
        <Icon name="user-plus" size="md" type="light" />
      </IconButton>
  )
}