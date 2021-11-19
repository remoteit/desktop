import React, { useEffect, useState, useRef } from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { emit } from '../services/Controller'
import {
  makeStyles,
  TextField,
  Input,
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  InputLabel,
} from '@material-ui/core'
import { IconButton } from '../buttons/IconButton'
import { Title } from './Title'
import { spacing } from '../styling'

type Props = {
  label?: string
  value?: string
  disabled?: boolean
  onSave?: (value: string) => void
}

export const InlineFileFieldSetting: React.FC<Props> = ({ label, value = '', disabled, onSave }) => {
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
    <ListItem button onClick={filePrompt} disabled={disabled} dense>
      <Title>
        <ListItemText className={css.margin}>
          {label && <InputLabel shrink>{label}</InputLabel>}
          {value || '–'}
        </ListItemText>
      </Title>
      <ListItemSecondaryAction>
        <IconButton title="Select file" icon="folder-open" size="md" onClick={filePrompt} />
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const useStyles = makeStyles({
  margin: { marginLeft: spacing.sm },
})
