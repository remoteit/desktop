import React, { useState } from 'react'
import { ListItemSetting } from '../ListItemSetting'
import { useSelector } from 'react-redux'
import { DEFAULT_TARGET } from '../../shared/constants'
import { ApplicationState } from '../../store'
import { serviceNameValidation } from '../../shared/nameHelper'
import { findType } from '../../models/applicationTypes'
import { makeStyles, Divider, Typography, TextField, List, ListItem, MenuItem, Button } from '@material-ui/core'
import { Columns } from '../Columns'
import { spacing } from '../../styling'

type Props = {
  name?: string
  target?: ITarget
  thisDevice: boolean
  onSubmit: (form: ITarget) => void
  onCancel: () => void
}

export const ServiceForm: React.FC<Props> = ({
  name = '',
  target = DEFAULT_TARGET,
  thisDevice,
  onSubmit,
  onCancel,
}) => {
  const { applicationTypes, setupBusy, deleting } = useSelector((state: ApplicationState) => ({
    applicationTypes: state.applicationTypes.all,
    setupBusy: state.ui.setupBusy,
    deleting: state.ui.setupServiceBusy === target?.uid,
  }))
  const disabled = setupBusy || deleting
  const [error, setError] = useState<string>()
  const [form, setForm] = useState<ITarget>({ ...target, name })
  const appType = findType(applicationTypes, form.type)
  const css = useStyles()

  return (
    <form onSubmit={() => onSubmit({ ...form, port: form.port || 1, name: form.name || appType.description })}>
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
            placeholder={appType.description}
            onChange={event => {
              const validation = serviceNameValidation(event.target.value)
              setForm({ ...form, name: validation.value })
              validation.error ? setError(validation.error) : setError(undefined)
            }}
          />
        </ListItem>
      </List>
      {thisDevice && (
        <>
          <Divider />
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
            <ListItem className={css.field}>
              <TextField
                select
                label="Service Type"
                value={form.type}
                disabled={disabled}
                variant="filled"
                onChange={event => {
                  const type: number = Number(event.target.value)
                  setForm({ ...form, type, port: findType(applicationTypes, type).port || form.port })
                }}
              >
                {applicationTypes.map(type => (
                  <MenuItem value={type.id} key={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="caption">
                {appType.description}
                <br />
                <em>
                  {appType.protocol} protocol {appType.proxy && ' - reverse proxy'}
                </em>
              </Typography>
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
                Local network IP address or fully qualified domain name
                <br />
                to host this service. Leave blank for this system to host.
              </Typography>
            </ListItem>
          </List>
        </>
      )}
      <Columns inset count={1}>
        <span>
          <Button type="submit" variant="contained" color="primary" disabled={setupBusy || !!error}>
            Save
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </span>
      </Columns>
    </form>
  )
}

const useStyles = makeStyles({
  field: {
    paddingLeft: 75,
    '& .MuiInputBase-root': { minWidth: 200, marginRight: 100 + spacing.lg },
  },
  fieldWide: {
    paddingLeft: 75,
    '& .MuiInputBase-root': { minWidth: 300, marginRight: spacing.lg },
  },
})
