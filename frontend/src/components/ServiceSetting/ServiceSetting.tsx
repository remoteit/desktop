import React from 'react'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { InlineSelectSetting } from '../InlineSelectSetting'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { serviceNameValidation } from '../../shared/nameHelper'
import { makeStyles, TextField, MenuItem, ListItem, Typography, CircularProgress } from '@material-ui/core'
import { serviceTypes, findType } from '../../services/serviceTypes'
import { Icon } from '../Icon'
import { spacing } from '../../styling'

type Props = {
  error?: string
  disabled?: boolean
  target?: ITarget
  onError?: (error: string | undefined) => void
  onUpdate: (target: ITarget) => void
}

export const ServiceSetting: React.FC<Props> = ({ error, disabled, target, onUpdate, onError = () => {} }) => {
  const css = useStyles()
  const busy = useSelector((state: ApplicationState) => state.ui.setupServiceBusy === target?.uid)
  disabled = disabled || busy

  if (!target) return null

  return (
    <>
      <ListItem className={css.fieldWide}>
        <TextField
          autoFocus
          label="Service Name"
          value={target.name}
          disabled={disabled}
          error={!!error}
          variant="filled"
          helperText={error || ''}
          onChange={event => {
            const validation = serviceNameValidation(event.target.value)
            onUpdate({ ...target, name: validation.value })
            validation.error ? onError(validation.error) : onError(undefined)
          }}
        />
      </ListItem>
      <ListItem className={css.field}>
        <TextField
          select
          label="Service Type"
          value={target.type}
          disabled={disabled}
          variant="filled"
          onChange={event => {
            const type: number = Number(event.target.value)
            onUpdate({ ...target, type, port: findType(type).defaultPort || target.port })
          }}
        >
          {serviceTypes.map(type => (
            <MenuItem value={type.id} key={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </TextField>
      </ListItem>
      <ListItem className={css.field}>
        <TextField
          size="small"
          label="Service Port"
          value={target.port}
          disabled={disabled}
          variant="filled"
          onChange={event => onUpdate({ ...target, port: +event.target.value })}
        />
      </ListItem>
      <ListItem className={css.fieldWide}>
        <TextField
          label="Service Host Address"
          value={target.hostname || ''}
          disabled={disabled}
          variant="filled"
          onChange={event => onUpdate({ ...target, hostname: event.target.value })}
        />
        <Typography variant="caption">
          Local network IP address or FQDN to host this service.
          <br />
          Leave blank for this system to host.
        </Typography>
      </ListItem>
    </>
  )
}

const useStyles = makeStyles({
  field: {
    paddingLeft: 75,
    '& .MuiInputBase-root': { minWidth: 200 },
  },
  fieldWide: {
    paddingLeft: 75,
    '& .MuiInputBase-root': { minWidth: 300, marginRight: spacing.lg },
  },
})
