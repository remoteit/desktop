import React from 'react'
import {  Button, Chip, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from '../Icon'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { spacing } from '../../styling'

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
            <Icon name="scroll" size="base" type="regular" className={css.scripting}/>
        </Tooltip>
      )}
      {Boolean(shared) && (
        <Tooltip enterDelay={500} title="">
            <Chip label={shared} size="small" variant="outlined" className={css.chip} />
        </Tooltip>
      )}
    </div>
  )
}

export function ShareSaveActions({
  onCancel,
  onSave,
}: {
  onCancel: () => void
  onSave: () => void
}): JSX.Element {
  const { saving } = useSelector((state: ApplicationState) => state.shares)
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
    marginTop: `${spacing.xxl}px`,
    marginRight: `${spacing.sm}px`,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderRadius: `${spacing.xxs}px`,
    minWidth: `${spacing.xxl}px`,
  },
  chip: {
    borderRadius: `${spacing.xxl}%`,
    marginRight: `${spacing.lg}px`,
  },
  scripting: {
    marginRight: `${spacing.md}px`
  },
  contentDetail: {
    marginRight: `${spacing.xxl}px`
  }
})
