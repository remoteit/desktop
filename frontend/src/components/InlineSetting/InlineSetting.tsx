import React, { useState } from 'react'
import {
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  TextField,
  Typography,
  Tooltip,
  IconButton,
} from '@material-ui/core'
import { EditButton } from '../../buttons/EditButton'
import { ResetButton } from '../../buttons/ResetButton'
import { makeStyles } from '@material-ui/styles'
import { colors } from '../../styling'
import { Icon } from '../Icon'

type Props = {
  value?: string | number
  label: string
  icon?: string
  displayValue?: string | number
  iconTooltip?: string
  filter?: RegExp
  disabled?: boolean
  resetValue?: string | number
  onSave: (value: string | number) => void
}

export const InlineSetting: React.FC<Props> = ({
  value = '',
  label,
  icon,
  iconTooltip,
  displayValue,
  disabled,
  resetValue,
  onSave,
  filter,
  children,
}) => {
  const [edit, setEdit] = useState<boolean>(false)
  const [editValue, setEditValue] = useState<string | number>('')

  const css = useStyles()
  const showEdit = () => {
    setEditValue(value)
    setEdit(true)
  }

  const LeftIcon = (
    <Tooltip open={iconTooltip ? undefined : false} title={iconTooltip}>
      <ListItemIcon>
        <Icon name={icon} size="md" weight="light" />
      </ListItemIcon>
    </Tooltip>
  )

  if (edit)
    return (
      <ListItem className={css.active}>
        {LeftIcon}
        <form
          className={css.form}
          onSubmit={() => {
            setEdit(false)
            onSave(editValue)
          }}
        >
          {children}
          <TextField
            autoFocus
            className={css.input}
            label={label}
            value={editValue}
            margin="dense"
            variant="filled"
            onChange={event => setEditValue(filter ? event.target.value.replace(filter, '') : event.target.value)}
          />
          {resetValue && <ResetButton onClick={() => setEditValue(resetValue)} />}
          <ListItemSecondaryAction>
            <Tooltip title="Cancel">
              <IconButton
                onClick={() => {
                  setEdit(false)
                  setEditValue(value)
                }}
              >
                <Icon name="times" size="md" fixedWidth />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save">
              <IconButton color="primary" type="submit">
                <Icon name="check" size="md" fixedWidth />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </form>
      </ListItem>
    )

  return (
    <ListItem button onClick={showEdit} disabled={disabled} style={{ opacity: 1 }}>
      {LeftIcon}
      <span className={css.text}>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="h2">{displayValue || value || '–'}</Typography>
      </span>
      {!disabled && (
        <ListItemSecondaryAction className={css.hidden}>
          <EditButton onClick={showEdit} />
        </ListItemSecondaryAction>
      )}
    </ListItem>
  )
}

const useStyles = makeStyles({
  form: { display: 'flex', width: '100%', marginRight: 120 },
  input: { flexGrow: 1 },
  text: { flexGrow: 1 },
  hidden: { display: 'none' },
  active: {
    backgroundColor: colors.primaryHighlight,
    padding: 0,
    '& > .MuiListItemIcon-root': { paddingLeft: 23 },
  },
})
