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
  let color

  if (destroying) {
    icon = 'spinner-third'
    color = 'danger'
  }

  return (
    <>
      {menuItem ? (
        <MenuItem dense disableGutters onClick={() => setOpen(true)} disabled={disabled}>
          <ListItemIcon>
            <Icon name={icon} size="md" color={color} spin={destroying} />
          </ListItemIcon>
          <ListItemText primary={title} />
        </MenuItem>
      ) : (
        <Tooltip title={title}>
          <span>
            <IconButton disabled={disabled} onClick={() => setOpen(true)}>
              <Icon name={icon} size="md" fixedWidth />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <Confirm
        open={open}
        onConfirm={() => {
          setOpen(false)
          onDelete()
        }}
        onDeny={() => setOpen(false)}
        title="Are you sure?"
        action="Delete"
      >
        {warning}
      </Confirm>
    </>
  )
}
