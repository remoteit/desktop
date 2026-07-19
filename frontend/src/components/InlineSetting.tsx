import React, { useEffect, useState, useRef } from 'react'
import { Box, ListItem, ListItemIcon, ListItemSecondaryAction, SxProps, Theme } from '@mui/material'
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
  DisplayComponent?: React.ReactElement<FormDisplayProps>
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
  DisplayComponent,
  children,
  ...props
}) => {
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
                buttonBaseSize="small"
                onMouseDown={cancelBlur}
                onClick={() => {
                  onResetClick()
                  setEdit(false)
                }}
              />
            )}
            <IconButton
              title="Cancel"
              icon="times"
              type="solid"
              size="md"
              buttonBaseSize="small"
              onClick={() => {
                setEdit(false)
                onCancel()
              }}
            />
            <IconButton
              title="Save"
              icon="check"
              color="primary"
              type="solid"
              size="md"
              buttonBaseSize="small"
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
