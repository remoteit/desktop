import React, { useEffect, useState, useRef } from 'react'
import { ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, InputLabel } from '@material-ui/core'
import { colors, spacing, fontSizes } from '../../styling'
import { EditButton } from '../../buttons/EditButton'
import { IconButton } from '../../buttons/IconButton'
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
  fieldRef?: React.RefObject<HTMLInputElement>
  debug?: boolean
  warning?: string
  onSubmit: () => void
  onResetClick: () => void
  onCancel: () => void
  onShowEdit: () => void
  onDelete?: () => void
}

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
  const canceled = useRef<boolean>(false)

  function triggerEdit() {
    setEdit(true)
    onShowEdit()
  }

  function cancelBlur() {
    canceled.current = true
  }

  useEffect(() => {
    if (!fieldRef?.current) return
    if (edit) {
      fieldRef.current.focus()
      fieldRef.current.onblur = () => {
        if (!canceled.current && !debug) setTimeout(() => setEdit(false), 200)
        canceled.current = false
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
            <IconButton
              title="Reset"
              icon="undo"
              type="solid"
              onMouseDown={cancelBlur}
              onClick={() => {
                onResetClick()
                fieldRef?.current?.focus()
              }}
            />
          )}
          <IconButton
            title="Cancel"
            icon="times"
            size="md"
            onClick={() => {
              !fieldRef && setEdit(false)
              onCancel()
            }}
          />
          <IconButton title="Save" icon="check" color="primary" size="md" onMouseDown={cancelBlur} submit />
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
    '& .MuiFilledInput-input': { paddingTop: 21, paddingBottom: 10, fontSize: 14 },
    '& .MuiFilledInput-multiline': { paddingTop: 0, paddingBottom: 0 },
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
