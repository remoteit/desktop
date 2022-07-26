import React, { useState } from 'react'
import { Button } from '@mui/material'
import { IconButton } from '../IconButton'

type Props = {
  id?: string
  all?: boolean
  disabled?: boolean
  onClick?: () => void
}

export const ClearButton: React.FC<Props> = ({ disabled, all, onClick }) => {
  const [deleting, setDeleting] = useState<boolean>(false)

  const handleClick = () => {
    setDeleting(true)
    onClick?.()
  }

  return all ? (
    <Button disabled={disabled} onClick={handleClick} size="small">
      Clear
    </Button>
  ) : (
    <IconButton
      disabled={disabled}
      onClick={handleClick}
      size="sm"
      buttonBaseSize="small"
      color={deleting ? 'danger' : undefined}
      loading={deleting}
      icon="times"
    />
  )
}
