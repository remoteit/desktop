import React from 'react'
import { Button } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'

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
    <section>
      <Button color="primary" onClick={onSave} disabled={disabled || saving} variant="contained">
        {saving ? 'Sharing...' : 'Share'}
      </Button>
      <Button disabled={saving} onClick={onCancel}>
        Cancel
      </Button>
    </section>
  )
}
