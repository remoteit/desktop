import React, { useEffect, useState, useRef } from 'react'
import { Box, ListItem, ListItemIcon, ListItemSecondaryAction, SxProps, Theme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { FormDisplay, FormDisplayProps } from './FormDisplay'
import { spacing, fontSizes } from '../styling'
import { IconButton } from '../buttons/IconButton'
import { Icon } from './Icon'

export const hideIconSx: SxProps<Theme> = { minWidth: `${spacing.sm}px` }

export const actionSx: SxProps<Theme> = {
  position: 'absolute',
  display: 'flex',
  minWidth: 60,
  justifyContent: 'center',
  zIndex: 1,
  right: 'auto',
  left: 18,
  marginTop: `${spacing.xs}px`,
}

export const viewSx: SxProps<Theme> = {
  paddingTop: '7px',
  paddingBottom: '7px',
  '& .MuiInputLabel-root': { position: 'absolute', marginTop: '1px' },
  '& .MuiInputLabel-root + .MuiListItemText-root': { marginTop: '15px', marginBottom: '3px' },
}

type Props = {
  value?: string | number
  label?: React.ReactNode
  icon?: React.ReactNode
  actionIcon?: React.ReactNode
  displayValue?: React.ReactNode
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
  invalid?: boolean // the value being edited cannot be saved: Save is greyed, and Enter does nothing
  waitForSave?: boolean // wait for the save result, which can be false to keep the draft open
  DisplayComponent?: React.ReactElement<FormDisplayProps>
  children?: React.ReactNode
  onSubmit: () => unknown
  onResetClick: () => unknown
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
  invalid,
  waitForSave,
  DisplayComponent,
  children,
  ...props
}) => {
  const [edit, setEdit] = useState<boolean>(false)
  const canceled = useRef<boolean>(false)
  const submitting = useRef(false)
  const { t } = useTranslation()

  function triggerEdit() {
    setEdit(true)
    onShowEdit()
  }

  function cancelBlur() {
    canceled.current = true
  }

  async function commit(action: () => unknown) {
    if (props.disabled || submitting.current) return
    submitting.current = true
    try {
      const result = action()
      if (waitForSave && (await result) === false) fieldRef?.current?.focus()
      else setEdit(false)
    } finally {
      submitting.current = false
    }
  }

  useEffect(() => {
    if (!fieldRef?.current) return
    if (edit) {
      fieldRef.current.focus()
      fieldRef.current.onblur = event => {
        const next = event.relatedTarget
        const inside = next instanceof Node && fieldRef.current?.form?.contains(next)
        if (!inside && !canceled.current && !submitting.current && !debug) {
          setTimeout(() => {
            if (!submitting.current) setEdit(false)
          }, 200)
        }
        canceled.current = false
      }
    }
  }, [edit])

  if (typeof icon === 'string') icon = <Icon name={icon} size="md" modified={modified} fixedWidth />
  icon = <ListItemIcon sx={hideIcon ? hideIconSx : undefined}>{icon}</ListItemIcon>

  const editForm = (
    <>
      {props.actionIcon && (
        <Box component="span" sx={actionSx}>
          {' '}
          {props.actionIcon}
        </Box>
      )}
      <ListItem
        sx={theme => ({
          paddingTop: 0,
          paddingBottom: 0,
          backgroundColor: theme.palette.primaryHighlight.main,
          minHeight: 51,
        })}
        disableGutters={disableGutters}
        dense
      >
        {icon}
        <Box
          component="form"
          sx={{
            display: 'flex',
            width: '100%',
            marginRight: '120px',
            alignItems: 'center',
            '& .MuiInput-input': { paddingTop: '13px', paddingBottom: '13px', marginLeft: `${spacing.sm}px` },
            '& .MuiFilledInput-input': { paddingTop: '21px', paddingBottom: '10px', fontSize: 14 },
            '& .MuiFilledInput-multiline': { paddingTop: 0, paddingBottom: 0 },
            '& .select': { marginLeft: 0, marginTop: '8px', height: 40, '& .MuiInput-root': { marginTop: '9px' } },
            '& .MuiSelect-select': { fontSize: fontSizes.base, paddingTop: '3px', paddingBottom: '4px' },
            '& .MuiListItemSecondaryAction-root': { right: `${spacing.xs}px` },
          }}
          onSubmit={e => {
            e.preventDefault()
            if (!invalid) void commit(onSubmit)
          }}
        >
          {children}
          <ListItemSecondaryAction>
            {resetValue != null && (
              <IconButton
                title={t('inlineSetting.reset', 'Reset')}
                icon="undo"
                type="solid"
                size="md"
                buttonBaseSize="small"
                disabled={props.disabled}
                onMouseDown={cancelBlur}
                onClick={() => void commit(onResetClick)}
              />
            )}
            <IconButton
              title={t('inlineSetting.cancel', 'Cancel')}
              icon="times"
              type="solid"
              size="md"
              buttonBaseSize="small"
              disabled={props.disabled}
              onClick={() => {
                if (submitting.current) return
                setEdit(false)
                onCancel()
              }}
            />
            <IconButton
              title={t('inlineSetting.save', 'Save')}
              icon="check"
              color="primary"
              type="solid"
              size="md"
              buttonBaseSize="small"
              disabled={invalid || props.disabled}
              onMouseDown={cancelBlur}
              submit
            />
          </ListItemSecondaryAction>
        </Box>
      </ListItem>
    </>
  )

  const viewForm = DisplayComponent ? (
    React.cloneElement(DisplayComponent, {
      ...props,
      icon,
      onClick: triggerEdit, // or another event handler
    })
  ) : (
    <FormDisplay
      {...props}
      icon={icon}
      hideIcon={hideIcon}
      modified={modified}
      disableGutters={disableGutters}
      onClick={triggerEdit}
    />
  )

  return edit ? editForm : viewForm
}
