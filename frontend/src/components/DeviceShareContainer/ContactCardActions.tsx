import React from 'react'
import { Button, Typography, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from '../Icon'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { spacing } from '../../styling'

export function ShareDetails({ scripting, shared }: { scripting?: boolean; shared?: number }): JSX.Element {
  const css = useStyles()
  return (
    <div className={css.contentDetail}>
      {!!shared && (
        <Tooltip title="Shared services" className={css.indicator}>
          <Typography variant="caption">{shared}</Typography>
        </Tooltip>
      )}
      {scripting || (
        <Tooltip title="Allow scripting">
          <Icon name="scroll" size="base" className={css.indicator} />
        </Tooltip>
      )}
    </div>
  )
}

export function ShareSaveActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }): JSX.Element {
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
    marginTop: spacing.xxl,
    marginRight: spacing.sm,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderRadius: spacing.xxs,
    minWidth: spacing.xxl,
  },
  indicator: {
    marginRight: spacing.md,
  },
  contentDetail: {
    marginRight: spacing.xxl,
  },
})
