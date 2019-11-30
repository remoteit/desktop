import React, { useState } from 'react'
import { EditButton } from '../../buttons/EditButton'
import { Icon } from '../Icon'
import { ListItem, ListItemIcon, ListItemSecondaryAction, Typography, Tooltip, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

type Props = {
  value?: string | number
  label: string
  icon?: string
  disabled?: boolean
  onSave: () => void
  onCancel: () => void
}

export const InlineSetting: React.FC<Props> = ({ value, label, icon, disabled, onSave, onCancel, children }) => {
  const [edit, setEdit] = useState<boolean>(false)
  const css = useStyles()

  if (edit)
    return (
      <ListItem>
        <ListItemIcon>
          <Icon name={icon} color="gray" size="lg" />
        </ListItemIcon>
        <form
          className={css.form}
          onSubmit={() => {
            setEdit(false)
            onSave()
          }}
        >
          {children}
          <ListItemSecondaryAction>
            <Tooltip title="Cancel">
              <IconButton
                onClick={() => {
                  setEdit(false)
                  onCancel()
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
    <ListItem button onClick={() => setEdit(true)} disabled={disabled} style={{ opacity: 1 }}>
      <ListItemIcon>
        <Icon name={icon} color="gray" size="lg" />
      </ListItemIcon>
      <span className={css.text}>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="h2">{value || '–'}</Typography>
      </span>
      {!disabled && (
        <ListItemSecondaryAction className={css.hidden}>
          <EditButton onClick={() => setEdit(true)} />
        </ListItemSecondaryAction>
      )}
    </ListItem>
  )
}

const useStyles = makeStyles({
  form: { display: 'flex', width: '100%', marginRight: 120 },
  text: { flexGrow: 1 },
  hidden: { display: 'none' },
})
