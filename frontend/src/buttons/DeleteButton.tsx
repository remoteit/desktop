import React, { useState } from 'react'
import { Tooltip, IconButton, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { Confirm } from '../components/Confirm'
import { Icon } from '../components/Icon'

type Props = {
  title?: string
  warning?: string | React.ReactElement
  icon?: string
  disabled?: boolean
  destroying?: boolean
  menuItem?: boolean
  onDelete: () => void
}

export const DeleteButton: React.FC<Props> = ({
  title = 'delete',
  warning,
  icon = 'trash',
  disabled,
  destroying,
  menuItem,
  onDelete,
}) => {
  const [open, setOpen] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  let color, spin

  if (deleting || destroying) {
    icon = 'spinner-third'
    color = 'danger'
    spin = true
  }

  const DeleteIcon = <Icon name={icon} size="md" color={color} spin={spin} fixedWidth />

  return (
    <>
      {menuItem ? (
        <MenuItem dense disableGutters onClick={() => setOpen(true)} disabled={disabled}>
          <ListItemIcon>{DeleteIcon}</ListItemIcon>
          <ListItemText primary={title} />
        </MenuItem>
      ) : (
        <Tooltip title={title}>
          <span>
            <IconButton disabled={disabled} onClick={() => setOpen(true)}>
              {DeleteIcon}
            </IconButton>
          </span>
        </Tooltip>
      )}
      <Confirm
        open={open}
        onConfirm={async () => {
          setOpen(false)
          setDeleting(true)
          await onDelete()
          setDeleting(false)
        }}
        onDeny={() => setOpen(false)}
        title="Are you sure?"
        action={title}
      >
        {warning}
      </Confirm>
    </>
  )
}
