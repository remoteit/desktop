import React from 'react'
import { Button } from '@mui/material'
import { IconButton } from '../IconButton'

type Props = {
  id?: string
  all?: boolean
  disabled?: boolean
  onClick?: () => void
}

export const ClearButton: React.FC<Props> = ({ disabled, all, onClick }) => {
  return all ? (
    <Button disabled={disabled} onClick={onClick} size="small">
      Clear
    </Button>
  ) : (
    <IconButton onClick={onClick} disabled={disabled} size="sm" type="light" icon="times" />
  )
}
