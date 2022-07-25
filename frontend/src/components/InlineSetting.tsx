import React, { useEffect, useState, useRef } from 'react'
import { ListItem, ListItemIcon, ListItemSecondaryAction } from '@mui/material'
import { spacing, fontSizes } from '../styling'
import { IconButton } from '../buttons/IconButton'
import { FormDisplay } from './FormDisplay'
import { makeStyles } from '@mui/styles'
import { Icon } from './Icon'

type Props = {
  value?: string | number
  label?: React.ReactNode
  icon?: React.ReactNode
  actionIcon?: React.ReactNode
  displayValue?: string | number
  disabled?: boolean
  loading?: boolean
  color?: string
  resetValue?: string | number
  hideIcon?: boolean
  fieldRef?: React.RefObject<HTMLInputElement>
  debug?: boolean
  warning?: React.ReactNode
  modified?: boolean
  disableGutters?: boolean
  children?: React.ReactNode
  onSubmit: () => void
  onResetClick: () => void
  onCancel: () => void
  onShowEdit: () => void
  onDelete?: () => void
}

export const InlineSetting: React.FC<Props> = ({
  icon,
  debug,
  resetValue,
  onSubmit,
  fieldRef,
  onResetClick,
  onCancel,
  onShowEdit,
  hideIcon,
  modified,
  disableGutters,
  children,
  ...viewFormProps
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

  if (typeof icon === 'string') icon = <Icon name={icon} size="md" modified={modified} fixedWidth />
  icon = <ListItemIcon className={hideIcon ? css.hideIcon : undefined}>{icon}</ListItemIcon>

  const editForm = (
    <ListItem className={css.active} disableGutters={disableGutters} dense>
      {icon}
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
              size="md"
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
            type="solid"
            size="md"
            onClick={() => {
              !fieldRef && setEdit(false)
              onCancel()
            }}
          />
          <IconButton
            title="Save"
            icon="check"
            color="primary"
            type="solid"
            size="md"
            onMouseDown={cancelBlur}
            submit
          />
        </ListItemSecondaryAction>
      </form>
    </ListItem>
  )

  const viewForm = (
    <FormDisplay
      {...viewFormProps}
      icon={icon}
      hideIcon={hideIcon}
      modified={modified}
      disableGutters={disableGutters}
      onClick={triggerEdit}
    />
  )

  return edit ? editForm : viewForm
}

export const useStyles = makeStyles(({ palette }) => ({
  view: {
    paddingTop: 7,
    paddingBottom: 7,
    '& .MuiInputLabel-root': { position: 'absolute', marginTop: 1 },
    '& .MuiInputLabel-root + .MuiListItemText-root': { marginTop: 15, marginBottom: 3 },
  },
  form: {
    display: 'flex',
    width: '100%',
    marginRight: 120,
    alignItems: 'center',
    '& .MuiInput-input': { paddingTop: 13, paddingBottom: 13, marginLeft: spacing.sm },
    '& .MuiFilledInput-input': { paddingTop: 21, paddingBottom: 10, fontSize: 14 },
    '& .MuiFilledInput-multiline': { paddingTop: 0, paddingBottom: 0 },
    '& .select': { marginLeft: 0, marginTop: 8, height: 40, '& .MuiInput-root': { marginTop: 9 } },
    '& .MuiSelect-select': { fontSize: fontSizes.base, paddingTop: 3, paddingBottom: 4 },
    '& .MuiListItemSecondaryAction-root': { right: spacing.xs },
  },
  active: {
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: palette.primaryHighlight.main,
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
}))
