import React from 'react'
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  InputLabel,
} from '@mui/material'
import { Box } from '@mui/material'
import { EditButton } from '../buttons/EditButton'
import { DeleteButton } from '../buttons/DeleteButton'
import { hideIconSx, actionSx, viewSx } from './InlineSetting'
import { Title } from './Title'
import { Icon } from './Icon'

export type FormDisplayProps = {
  label?: React.ReactNode
  icon?: React.ReactNode
  value?: string | number | React.ReactNode
  actionIcon?: React.ReactNode
  displayValue?: string | number | React.ReactNode
  disabled?: boolean
  loading?: boolean
  color?: string
  warning?: React.ReactNode
  hideIcon?: boolean
  modified?: boolean
  disableGutters?: boolean
  displayOnly?: boolean
  hideEmpty?: boolean
  onDelete?: () => void
  onClick?: () => void
}

export const FormDisplay: React.FC<FormDisplayProps> = ({
  label,
  icon,
  value = '',
  actionIcon,
  displayValue,
  disabled,
  loading,
  color,
  warning,
  hideIcon,
  modified,
  hideEmpty,
  disableGutters,
  displayOnly,
  onDelete,
  onClick,
}) => {
  if (hideEmpty && !value) return null
  if (typeof icon === 'string') icon = <Icon name={icon} size="md" modified={modified} fixedWidth />
  icon = <ListItemIcon sx={hideIcon ? hideIconSx : undefined}>{icon}</ListItemIcon>

  const content = (
    <>
      {icon}
      <Title>
        {label && <InputLabel shrink>{label}</InputLabel>}
        <ListItemText style={{ color }}>{(displayValue === undefined ? value : displayValue) || '–'}</ListItemText>
      </Title>
      {!disabled && !displayOnly && (
        <ListItemSecondaryAction className="hidden">
          <EditButton onClick={onClick} />
          {onDelete && <DeleteButton onDelete={onDelete} warning={warning} />}
        </ListItemSecondaryAction>
      )}
      {loading && (
        <ListItemSecondaryAction>
          <Icon spin type="solid" name="spinner-third" color="primary" inlineLeft />
        </ListItemSecondaryAction>
      )}
    </>
  )

  return (
    <>
      {actionIcon && (
        <Box component="span" sx={actionSx}>
          {' '}
          {actionIcon}
        </Box>
      )}
      {displayOnly ? (
        <ListItem sx={viewSx} disableGutters={disableGutters} dense>
          {content}
        </ListItem>
      ) : (
        <ListItemButton sx={viewSx} onClick={onClick} disabled={disabled} disableGutters={disableGutters} dense>
          {content}
        </ListItemButton>
      )}
    </>
  )
}
