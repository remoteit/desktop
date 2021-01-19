import React from 'react'
import { Button } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { Icon } from '../Icon'

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
      <Button color="primary" onClick={onSave} disabled={disabled} variant="contained">
        Save
        {saving ? (
          <Icon name="spinner-third" spin type="regular" inline fixedWidth />
        ) : (
          <Icon name="check" type="regular" inline fixedWidth />
        )}
      </Button>
      <Button disabled={saving} onClick={onCancel}>
        Cancel
      </Button>
    </section>
  )
}
