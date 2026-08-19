import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { ListItemButton, ListItemText, ListItemSecondaryAction, InputLabel, TextFieldProps } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'
import { emit } from '../services/Controller'

type Props = {
  label?: string
  value?: string
  token: string
  variant?: TextFieldProps['variant']
  disabled?: boolean
  disableGutters?: boolean
  dense?: boolean
  onSave?: (value?: string) => void
  className?: string
}

export const InlineFileFieldSetting: React.FC<Props> = ({
  label,
  value = '',
  token,
  variant,
  disabled,
  disableGutters,
  dense = true,
  onSave,
  className,
}) => {
  const { t } = useTranslation()
  const { filePath } = useSelector((state: State) => state.backend)
  const dispatch = useDispatch<Dispatch>()

  const filePrompt = () => emit('filePrompt', token)

  useEffect(() => {
    if (filePath) {
      onSave && onSave(filePath)
      dispatch.backend.set({ filePath: undefined })
    }
  }, [filePath])

  return (
    <ListItemButton
      className={className}
      sx={theme => ({
        backgroundColor: variant === 'filled' ? theme.palette.grayLightest.main : undefined,
        '& .MuiListItemText-root': { marginLeft: `${spacing.sm}px` },
        '& .MuiListItemSecondaryAction-root': { right: `${spacing.xs}px` },
      })}
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
        <IconButton
          title={t('inlineFileFieldSetting.reset', 'Reset')}
          icon="undo"
          type="solid"
          size="sm"
          onClick={() => onSave && onSave(undefined)}
        />
        <IconButton
          title={t('inlineFileFieldSetting.selectApplication', 'Select Application')}
          icon="folder-open"
          size="md"
          onClick={filePrompt}
        />
      </ListItemSecondaryAction>
    </ListItemButton>
  )
}
