import React, { useState } from 'react'
import { Button } from '@mui/material'
import { IconButton } from '../IconButton'

type Props = {
  id?: string
  all?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export const ClearButton: React.FC<Props> = ({ all, onClick, ...props }) => {
  const [deleting, setDeleting] = useState<boolean>(false)

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    setDeleting(true)
    onClick?.()
  }

  return all ? (
    <Button {...props} onClick={handleClick} color="inherit" size="small">
      Clear
    </Button>
  ) : (
    <IconButton
      {...props}
      onClick={handleClick}
      size="sm"
      buttonBaseSize="small"
      color={deleting ? 'danger' : undefined}
      loading={deleting}
      icon="times"
    />
  )
}
