import React, { useEffect } from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles, ListItem, ListItemText, ListItemSecondaryAction, InputLabel } from '@material-ui/core'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'
import { Title } from './Title'
import { emit } from '../services/Controller'

type Props = {
  label?: string
  value?: string
  disabled?: boolean
  disableGutters?: boolean
  onSave?: (value?: string) => void
}

export const InlineFileFieldSetting: React.FC<Props> = ({ label, value = '', disabled, disableGutters, onSave }) => {
  const { filePath } = useSelector((state: ApplicationState) => state.backend)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  const filePrompt = () => emit('filePrompt')

  useEffect(() => {
    if (filePath) {
      onSave && onSave(filePath)
      dispatch.backend.set({ filePath: undefined })
    }
  }, [filePath])

  return (
    <ListItem button onClick={filePrompt} disabled={disabled} disableGutters={disableGutters} dense>
      <ListItemText className={css.margin}>
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

const useStyles = makeStyles({
  margin: { marginLeft: spacing.sm },
})
