import React from 'react'
import { Button, ListItemSecondaryAction, Tooltip, Chip, makeStyles } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { spacing } from '../../styling'
import { Icon } from '../Icon'

export function ShareDetails({ scripting, shared }: { scripting?: boolean; shared?: number }): JSX.Element {
  const css = useStyles()
  return (
    <ListItemSecondaryAction className={css.indicators}>
      {scripting && (
        <Tooltip title="Allow scripting">
          <Icon name="scroll" size="md" color="grayDark" />
        </Tooltip>
      )}
      {!!shared && (
        <Tooltip title="Shared services">
          <Chip label={shared} size="small" />
        </Tooltip>
      )}
    </ListItemSecondaryAction>
  )
}

export function ShareSaveActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }): JSX.Element {
  const { saving } = useSelector((state: ApplicationState) => state.shares)
  return (
    <section>
      <Button color="primary" onClick={onSave} disabled={saving} variant="contained">
        Share
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

const useStyles = makeStyles({
  indicators: {
    display: 'flex',
    alignItems: 'center',
    '& > *': { marginLeft: spacing.lg },
  },
})
