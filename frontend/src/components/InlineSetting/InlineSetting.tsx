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
import { makeStyles } from '@material-ui/core/styles'
import { Title } from '../Title'
import { Icon } from '../Icon'

type Props = {
  value?: string | number
  label: JSX.Element | string
  icon?: JSX.Element
  actionIcon?: JSX.Element
  displayValue?: string | number
  disabled?: boolean
  resetValue?: string | number
  fieldRef: React.RefObject<HTMLInputElement>
  onSubmit: () => void
  onResetClick: () => void
  onCancel: () => void
  onShowEdit: () => void
}

let canceled = false

export const InlineSetting: React.FC<Props> = ({
  label,
  icon,
  value = '',
  actionIcon,
  displayValue,
  disabled,
  resetValue,
  onSubmit,
  fieldRef,
  onResetClick,
  onCancel,
  onShowEdit,
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
        if (!canceled) setTimeout(() => setEdit(false), 200)
        canceled = false
      }
    }
  }, [edit])

  if (edit)
    return (
      <ListItem className={css.active} dense>
        <ListItemIcon>{icon}</ListItemIcon>
        <form
          className={css.form}
          onSubmit={e => {
            e.preventDefault()
            onSubmit()
            setEdit(false)
          }}
        >
          {children}
          {resetValue != null && (
            <ResetButton
              onMouseDown={cancelBlur}
              onClick={() => {
                onResetClick()
                fieldRef.current?.focus()
              }}
            />
          )}
          <ListItemSecondaryAction>
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

  return (
    <>
      {actionIcon && <span className={css.action}> {actionIcon}</span>}
      <ListItem button onClick={triggerEdit} disabled={disabled} style={{ opacity: 1 }} dense>
        <ListItemIcon>{icon}</ListItemIcon>
        <Title>
          <ListItemText>
            <InputLabel shrink>{label}</InputLabel>
            {displayValue || value || '–'}
          </ListItemText>
        </Title>
        {!disabled && (
          <ListItemSecondaryAction className="hidden">
            <EditButton onClick={triggerEdit} />
          </ListItemSecondaryAction>
        )}
      </ListItem>
    </>
  )
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
    '& .select': { marginLeft: 0, marginTop: 8, height: 40, '& .MuiInput-root': { marginTop: 9 } }, // paddingTop: 3, marginTop: -6 },
    '& .MuiSelect-select': { fontSize: fontSizes.base, paddingTop: 3, paddingBottom: 4 },
  },
  active: {
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: colors.primaryHighlight,
  },
  action: {
    position: 'absolute',
    zIndex: 1,
    right: 'auto',
    left: spacing.md,
    marginTop: spacing.xs,
  },
})
