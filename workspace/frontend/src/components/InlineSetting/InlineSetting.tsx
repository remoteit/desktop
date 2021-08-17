import React, { useEffect, useState } from 'react'
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  InputLabel,
  Tooltip,
  IconButton,
} from '@material-ui/core'
import { colors, spacing, fontSizes } from '../../styling'
import { EditButton } from '../../buttons/EditButton'
import { ResetButton } from '../../buttons/ResetButton'
import { DeleteButton } from '../../buttons/DeleteButton'
import { makeStyles } from '@material-ui/core/styles'
import { Title } from '../Title'
import { Icon } from '../Icon'

type Props = {
  value?: string | number
  label?: JSX.Element | string
  icon?: JSX.Element | string
  actionIcon?: JSX.Element
  displayValue?: string | number
  disabled?: boolean
  resetValue?: string | number
  hideIcon?: boolean
  fieldRef: React.RefObject<HTMLInputElement>
  debug?: boolean
  warning?: string
  onSubmit: () => void
  onResetClick: () => void
  onCancel: () => void
  onShowEdit: () => void
  onDelete?: () => void
}

let canceled = false

export const InlineSetting: React.FC<Props> = ({
  label,
  icon,
  value = '',
  actionIcon,
  displayValue,
  disabled,
  debug,
  warning,
  resetValue,
  onSubmit,
  fieldRef,
  onResetClick,
  onCancel,
  onShowEdit,
  onDelete,
  hideIcon,
  children,
}) => {
  const css = useStyles()
  const [edit, setEdit] = useState<boolean>(false)

  function triggerEdit() {
    setEdit(true)
    onShowEdit()
  }

  function cancelBlur() {
    canceled = true
  }

  useEffect(() => {
    if (!fieldRef?.current) return
    if (edit) {
      fieldRef.current.focus()
      fieldRef.current.onblur = () => {
        if (!canceled && !debug) setTimeout(() => setEdit(false), 200)
        canceled = false
      }
    }
  }, [edit])

  if (typeof icon === 'string') icon = <Icon name={icon} size="md" />

  const editForm = (
    <ListItem className={css.active} dense>
      <ListItemIcon className={hideIcon ? css.hideIcon : undefined}>{icon}</ListItemIcon>
      <form
        className={css.form}
        onSubmit={e => {
          e.preventDefault()
          onSubmit()
          setEdit(false)
        }}
      >
        {children}
        <ListItemSecondaryAction>
          {resetValue != null && (
            <ResetButton
              onMouseDown={cancelBlur}
              onClick={() => {
                onResetClick()
                fieldRef.current?.focus()
              }}
            />
          )}
          <Tooltip title="Cancel">
            <IconButton onClick={onCancel}>
              <Icon name="times" size="md" fixedWidth />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save">
            <IconButton color="primary" type="submit" onMouseDown={cancelBlur}>
              <Icon name="check" size="md" fixedWidth />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      </form>
    </ListItem>
  )

  const viewForm = (
    <>
      {actionIcon && <span className={css.action}> {actionIcon}</span>}
      <ListItem button onClick={triggerEdit} disabled={disabled} dense>
        <ListItemIcon className={hideIcon ? css.hideIcon : undefined}>{icon}</ListItemIcon>
        <Title>
          <ListItemText>
            {label && <InputLabel shrink>{label}</InputLabel>}
            {displayValue || value || '–'}
          </ListItemText>
        </Title>
        {!disabled && (
          <ListItemSecondaryAction className="hidden">
            <EditButton onClick={triggerEdit} />
            {onDelete && <DeleteButton onDelete={onDelete} warning={warning} />}
          </ListItemSecondaryAction>
        )}
      </ListItem>
    </>
  )

  return edit ? editForm : viewForm
}

const useStyles = makeStyles({
  form: {
    display: 'flex',
    width: '100%',
    marginRight: 120,
    alignItems: 'center',
    '& .MuiFormControl-root': { flexGrow: 1, margin: `0 ${spacing.md}px -1px ${spacing.sm}px` },
    '& .MuiFilledInput-input': { paddingTop: 22, paddingBottom: 10, fontSize: 14 },
    '& .MuiFilledInput-multiline': { paddingTop: 0, paddingBottom: 0 },
    '& .MuiTextField-root': { marginLeft: -12 },
    '& .MuiInput-root': { marginRight: spacing.sm, padding: '3px 0 2px', fontSize: 14 },
    '& .select': { marginLeft: 0, marginTop: 8, height: 40, '& .MuiInput-root': { marginTop: 9 } },
    '& .MuiSelect-select': { fontSize: fontSizes.base, paddingTop: 3, paddingBottom: 4 },
    '& .MuiListItemSecondaryAction-root': { right: spacing.sm },
  },
  active: {
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: colors.primaryHighlight,
  },
  action: {
    position: 'absolute',
    display: 'flex',
    minWidth: 60,
    justifyContent: 'center',
    zIndex: 1,
    right: 'auto',
    left: 20,
    marginTop: spacing.xs,
  },
  hideIcon: {
    minWidth: spacing.sm,
  },
})
