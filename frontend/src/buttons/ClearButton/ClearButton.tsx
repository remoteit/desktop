import React from 'react'
import { makeStyles, Button } from '@material-ui/core'
import { IconButton } from '../IconButton'
import { spacing } from '../../styling'

type Props = {
  id?: string
  all?: boolean
  disabled?: boolean
  onClick?: () => void
}

export const ClearButton: React.FC<Props> = ({ disabled, all, onClick }) => {
  const css = useStyles()
  return all ? (
    <Button disabled={disabled} onClick={onClick} size="small">
      Clear all
    </Button>
  ) : (
    <IconButton className={css.button} onClick={onClick} disabled={disabled} size="sm" type="light" icon="times" />
  )
}

const useStyles = makeStyles(theme => ({
  button: { padding: spacing.xs, marginRight: spacing.xs, color: theme.palette.gray.main },
}))
