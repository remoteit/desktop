import React from 'react'
import { makeStyles, Button } from '@material-ui/core'
import { IconButton } from '../IconButton'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { spacing } from '../../styling'

type Props = {
  id?: string
  all?: boolean
  disabled?: boolean
}

export const ClearButton: React.FC<Props> = ({ disabled, id, all }) => {
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  if (!all && !id) return null

  const forget = () => {
    // @TODO add confirm to clear all
    if (id) dispatch.connections.clear(id)
    else dispatch.connections.clearRecent()
  }

  return all ? (
    <Button disabled={disabled} onClick={forget} size="small">
      Clear all
    </Button>
  ) : (
    <IconButton className={css.button} onClick={forget} disabled={disabled} size="sm" type="light" icon="times" />
  )
}

const useStyles = makeStyles(theme => ({
  button: { padding: spacing.xs, marginRight: spacing.xs, color: theme.palette.gray.main },
}))
