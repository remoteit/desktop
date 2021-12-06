import React from 'react'
import { Button } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'

export function TransferSaveActions({
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
    <section style={{ padding: 0 }}>
      <Button color="primary" onClick={onSave} disabled={disabled || saving} variant="contained" style={{ borderRadius: 3 }}>
        {saving ? 'Transfering' : 'TRANSFER DEVICE'}
      </Button>
      <Button disabled={saving} onClick={onCancel}>
        Cancel
      </Button>
    </section>
  )
}
