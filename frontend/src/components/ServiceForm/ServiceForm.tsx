import React, { useState } from 'react'
import { ListItemSetting } from '../ListItemSetting'
import { useSelector, useDispatch } from 'react-redux'
import { DEFAULT_TARGET } from '../../shared/constants'
import { ApplicationState, Dispatch } from '../../store'
import { serviceNameValidation } from '../../shared/nameHelper'
import { serviceTypes, findType } from '../../services/serviceTypes'
import { makeStyles, Divider, Typography, TextField, List, ListItem, MenuItem, Button } from '@material-ui/core'
import { Columns } from '../Columns'
import { spacing } from '../../styling'

type Props = {
  name?: string
  target?: ITarget
  onSubmit: (form: ITarget) => void
}

export const ServiceForm: React.FC<Props> = ({ name = '', target = DEFAULT_TARGET, onSubmit }) => {
  const { setupBusy, deleting } = useSelector((state: ApplicationState) => ({
    setupBusy: state.ui.setupBusy,
    deleting: state.ui.setupServiceBusy === target?.uid,
  }))
  const disabled = setupBusy || deleting
  const [error, setError] = useState<string>()
  const [form, setForm] = useState<ITarget>({ ...target, name })
  const css = useStyles()

  return (
    <form onSubmit={() => onSubmit(form)}>
      <List>
        <ListItemSetting
          label="Enable service"
          subLabel="Disabling your service will take it offline."
          icon="circle-check"
          toggle={!form.disabled}
          disabled={setupBusy}
          onClick={() => {
            setForm({ ...form, disabled: !form.disabled })
          }}
        />
      </List>
      <Divider />
      <List>
        <ListItem className={css.fieldWide}>
          <TextField
            autoFocus
            label="Service Name"
            value={form.name}
            disabled={disabled}
            error={!!error}
            variant="filled"
            helperText={error || ''}
            onChange={event => {
              const validation = serviceNameValidation(event.target.value)
              setForm({ ...form, name: validation.value })
              validation.error ? setError(validation.error) : setError(undefined)
            }}
          />
        </ListItem>
        <ListItem className={css.field}>
          <TextField
            select
            label="Service Type"
            value={form.type}
            disabled={disabled}
            variant="filled"
            onChange={event => {
              const type: number = Number(event.target.value)
              setForm({ ...form, type, port: findType(type).defaultPort || form.port })
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
            value={form.port}
            disabled={disabled}
            variant="filled"
            onChange={event => setForm({ ...form, port: +event.target.value })}
          />
        </ListItem>
        <ListItem className={css.fieldWide}>
          <TextField
            label="Service Host Address"
            value={form.hostname || ''}
            disabled={disabled}
            variant="filled"
            onChange={event => setForm({ ...form, hostname: event.target.value })}
          />
          <Typography variant="caption">
            Local network IP address or FQDN to host this service.
            <br />
            Leave blank for this system to host.
          </Typography>
        </ListItem>
      </List>
      <Columns inset count={1}>
        <span>
          <Button type="submit" variant="contained" color="primary" disabled={setupBusy || !!error}>
            Save
          </Button>
        </span>
      </Columns>
    </form>
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
