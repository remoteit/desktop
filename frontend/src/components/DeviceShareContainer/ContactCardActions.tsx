import React from 'react'
import {  Button, Chip, IconButton, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from '../Icon'

export function ShareDetails({
  scripting,
  shared,
}: {
  scripting: boolean
  shared: number
}): JSX.Element {
  const css = useStyles()
  return (
    <div className={css.contentDetail}>
      {scripting && (
        <Tooltip enterDelay={500} title="Sharing ability to execute scripts">
          <IconButton className={css.icon}>
            <Icon name="scroll" size="base" type="regular" />
          </IconButton>
        </Tooltip>
      )}
      {Boolean(shared) && (
        <Tooltip enterDelay={500} title="">
          <IconButton className={css.icon}>
            <Chip label={shared} size="small" variant="outlined" className={css.chip} />
          </IconButton>
        </Tooltip>
      )}
    </div>
  )
}

export function ShareSaveActions({
  onCancel,
  onSave,
  saving,
}: {
  onCancel: () => void
  onSave: () => void
  saving: boolean
}): JSX.Element {
  const css = useStyles()
  return (
    <>
      <Button color="primary" onClick={onSave} disabled={saving} variant="contained" className={css.button}>
        <span className="mr-md">SHARE</span>
        {saving ? <Icon name="spinner-third" spin fixedWidth /> : <Icon name="check" fixedWidth />}
      </Button>
      <Button disabled={saving} onClick={onCancel} variant="outlined" className={css.button}>
        CANCEL
      </Button>
    </>
  )
}

const useStyles = makeStyles({
  button: {
    marginTop: '40px',
    marginRight: '10px',
    padding: '5px 10px 5px 10px',
    borderRadius: '3px',
    minWidth: '45px',
  },
  chip: {
    borderRadius: '50%',
  },
  icon: {
    marginRight: '10px',
  },
  contentDetail: {
    marginRight: '40px'
  }
})
