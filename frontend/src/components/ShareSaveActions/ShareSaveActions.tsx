import React from 'react'
import { Button } from '@mui/material'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { Gutters } from '../Gutters'

export function ShareSaveActions({
  onCancel,
  onSave,
  disabled,
}: {
  onCancel: () => void
  onSave: () => void
  disabled: boolean
}): JSX.Element {
  const { sharing: saving } = useSelector((state: ApplicationState) => state.shares)
  return (
    <Gutters>
      <Button color="primary" onClick={onSave} disabled={disabled || saving} variant="contained">
        {saving ? 'Sharing...' : 'Share'}
      </Button>
      <Button disabled={saving} onClick={onCancel}>
        Cancel
      </Button>
    </Gutters>
  )
}
