import React from 'react'
import { ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, InputLabel } from '@mui/material'
import { EditButton } from '../buttons/EditButton'
import { DeleteButton } from '../buttons/DeleteButton'
import { useStyles } from './InlineSetting'
import { Title } from './Title'
import { Icon } from './Icon'

type Props = {
  label?: React.ReactNode
  icon?: React.ReactNode
  value?: string | number
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
  onDelete?: () => void
  onClick?: () => void
}

export const FormDisplay: React.FC<Props> = ({
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
  disableGutters,
  displayOnly,
  onDelete,
  onClick,
}) => {
  const css = useStyles()
  if (typeof icon === 'string') icon = <Icon name={icon} size="md" modified={modified} fixedWidth />
  icon = <ListItemIcon className={hideIcon ? css.hideIcon : undefined}>{icon}</ListItemIcon>

  return (
    <>
      {actionIcon && <span className={css.action}> {actionIcon}</span>}
      <ListItem
        button={!displayOnly as false}
        className={css.view}
        onClick={onClick}
        disabled={disabled}
        disableGutters={disableGutters}
        dense
      >
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
      </ListItem>
    </>
  )
}
