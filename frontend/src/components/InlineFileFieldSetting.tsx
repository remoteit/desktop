import React, { useEffect } from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from '@mui/styles'
import { ListItem, ListItemText, ListItemSecondaryAction, InputLabel, TextFieldProps } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'
import { emit } from '../services/Controller'

type Props = {
  label?: string
  value?: string
  variant?: TextFieldProps['variant']
  disabled?: boolean
  disableGutters?: boolean
  dense?: boolean
  onSave?: (value?: string) => void
}

export const InlineFileFieldSetting: React.FC<Props> = ({
  label,
  value = '',
  variant,
  disabled,
  disableGutters,
  dense = true,
  onSave,
}) => {
  const { filePath } = useSelector((state: ApplicationState) => state.backend)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles({ filled: variant === 'filled' })

  const filePrompt = () => emit('filePrompt')

  useEffect(() => {
    if (filePath) {
      onSave && onSave(filePath)
      dispatch.backend.set({ filePath: undefined })
    }
  }, [filePath])

  return (
    <ListItem
      button
      classes={{ container: css.container }}
      onClick={filePrompt}
      disabled={disabled}
      disableGutters={disableGutters}
      dense={dense}
    >
      <ListItemText>
        {label && <InputLabel shrink>{label}</InputLabel>}
        {value || '–'}
      </ListItemText>
      <ListItemSecondaryAction>
        <IconButton title="Reset" icon="undo" type="solid" size="sm" onClick={() => onSave && onSave(undefined)} />
        <IconButton title="Select Application" icon="folder-open" size="md" onClick={filePrompt} />
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  container: ({ filled }: { filled?: boolean }) => ({
    '& .MuiListItem-root': { backgroundColor: filled ? palette.grayLightest.main : undefined },
    '& .MuiListItemText-root': { marginLeft: spacing.sm },
    '& .MuiListItemSecondaryAction-root': { right: filled ? spacing.xs : undefined },
  }),
}))
