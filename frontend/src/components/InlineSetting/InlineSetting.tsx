import React, { useEffect, useState, useRef } from 'react'
import {
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  TextField,
  Typography,
  Tooltip,
  IconButton,
} from '@material-ui/core'
import { colors, spacing } from '../../styling'
import { EditButton } from '../../buttons/EditButton'
import { ResetButton } from '../../buttons/ResetButton'
import { makeStyles } from '@material-ui/core/styles'
import { Title } from '../Title'
import { Icon } from '../Icon'

type Props = {
  value?: string | number
  label: string
  icon?: JSX.Element
  displayValue?: string | number
  disabled?: boolean
  resetValue?: string | number
  fieldRef: React.RefObject<HTMLInputElement>
  onSubmit: () => void
  onResetClick: () => void
  onCancel: () => void
  onShowEdit: () => void
}

export const InlineSetting: React.FC<Props> = ({
  label,
  icon,
  value = '',
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
  const [focusTimeout, setFocusTimeout] = useState<NodeJS.Timeout>()
  const [edit, setEdit] = useState<boolean>(false)

  function triggerEdit() {
    setEdit(true)
    onShowEdit()
  }

  function cancelBlur() {
    if (focusTimeout) {
      clearTimeout(focusTimeout)
      setFocusTimeout(undefined)
    }
  }

  useEffect(() => {
    if (!fieldRef?.current) return
    if (edit) {
      fieldRef.current.focus()
      fieldRef.current.onblur = () => {
        setFocusTimeout(setTimeout(() => setEdit(false), 200))
      }
    }
  }, [edit])

  if (edit)
    return (
      <ListItem className={css.active + ' ' + css.root}>
        <ListItemIcon>{icon}</ListItemIcon>
        <form
          className={css.form}
          onSubmit={e => {
            e.preventDefault()
            onSubmit()
            fieldRef.current?.blur()
          }}
        >
          {children}
          {resetValue && (
            <ResetButton
              onClick={() => {
                cancelBlur()
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
              <IconButton color="primary" type="submit">
                <Icon name="check" size="md" fixedWidth />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </form>
      </ListItem>
    )

  return (
    <ListItem className={css.root} button onClick={triggerEdit} disabled={disabled} style={{ opacity: 1 }}>
      <ListItemIcon>{icon}</ListItemIcon>
      <Title>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="h2">{displayValue || value || '–'}</Typography>
      </Title>
      {!disabled && (
        <ListItemSecondaryAction className="hidden">
          <EditButton onClick={triggerEdit} />
        </ListItemSecondaryAction>
      )}
    </ListItem>
  )
}

const useStyles = makeStyles({
  form: {
    display: 'flex',
    width: '100%',
    marginRight: 120,
    alignItems: 'center',
    '& .MuiFormControl-root': { flexGrow: 1, margin: `0 ${spacing.md}px -1px ${spacing.sm}px` },
    '& .MuiTextField-root': { marginLeft: 0 },
  },
  root: { height: 63 },
  active: {
    backgroundColor: colors.primaryHighlight,
    padding: 0,
    '& > .MuiListItemIcon-root': { paddingLeft: spacing.lg },
  },
})
