import React, { useState, useEffect } from 'react'
import { makeStyles, Divider, Typography, TextField, List, ListItem, MenuItem, Button } from '@material-ui/core'
import { ROUTES } from '../../shared/constants'
import { useSelector } from 'react-redux'
import { DEFAULT_TARGET } from '../../shared/constants'
import findApplication, { useApplication } from '../../shared/applications'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { ApplicationState } from '../../store'
import { TemplateSetting } from '../TemplateSetting'
import { serviceNameValidation } from '../../shared/nameHelper'
import { findType } from '../../models/applicationTypes'
import { Columns } from '../Columns'
import { spacing } from '../../styling'

type Props = IService['attributes'] & {
  name?: string
  target?: ITarget
  thisDevice: boolean
  onSubmit: (form: ITarget & IService['attributes']) => void
  onCancel: () => void
}

export const ServiceForm: React.FC<Props> = ({
  name,
  username,
  route = ROUTES[0].key,
  commandTemplate,
  launchTemplate,
  target = DEFAULT_TARGET,
  thisDevice,
  onSubmit,
  onCancel,
}) => {
  const { applicationTypes, setupBusy, deleting, routingLock, routingMessage } = useSelector(
    (state: ApplicationState) => ({
      applicationTypes: state.applicationTypes.all,
      setupBusy: state.ui.setupBusy,
      deleting: state.ui.setupServiceBusy === target?.uid,
      routingLock: state.ui.routingLock,
      routingMessage: state.ui.routingMessage,
    })
  )
  const disabled = setupBusy || deleting
  const [error, setError] = useState<string>()
  const [form, setForm] = useState<ITarget & IService['attributes']>(() => {
    const defaults = findApplication(target.type)
    const defaultAppType = findType(applicationTypes, target.type)
    return {
      ...target,
      route: routingLock || route,
      name: name || serviceNameValidation(defaultAppType.description).value,
      username: username || '',
      commandTemplate: commandTemplate || defaults.commandTemplate,
      launchTemplate: launchTemplate || defaults.launchTemplate,
    }
  })
  const appType = findType(applicationTypes, form.type)
  const app = useApplication(form.type)
  const css = useStyles()

  return (
    <form onSubmit={() => onSubmit({ ...form, port: form.port || 1 })}>
      <List>
        {thisDevice && (
          <>
            <ListItem className={css.field}>
              <TextField
                select
                autoFocus
                label="Service Type"
                value={form.type}
                disabled={disabled}
                variant="filled"
                onChange={event => {
                  const type = Number(event.target.value)
                  const updatedApp = findApplication(type)
                  const updatedAppType = findType(applicationTypes, type)
                  setForm({
                    ...form,
                    type,
                    port: findType(applicationTypes, type).port || 0,
                    name: serviceNameValidation(updatedAppType.description).value,
                    commandTemplate: updatedApp.commandTemplate,
                    launchTemplate: updatedApp.launchTemplate,
                  })
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
                value={form.hostname}
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
          </>
        )}
      </List>
      <Divider />
      <List>
        <ListItem className={css.fieldWide}>
          <TextField
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
        {app.tokens.includes('username') && (
          <ListItem className={css.fieldWide}>
            <TextField
              label="Username"
              value={form.username}
              disabled={disabled}
              variant="filled"
              onChange={event => setForm({ ...form, username: event.target.value })}
            />
          </ListItem>
        )}
        <ListItem className={css.fieldWide}>
          <TextField
            select
            label="Routing"
            value={form.route}
            disabled={!!routingLock || disabled}
            variant="filled"
            onChange={event => {
              setForm({ ...form, route: event.target.value as IRouteType })
            }}
          >
            {ROUTES.map(route => (
              <MenuItem value={route.key} key={route.key}>
                {route.name}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="caption">
            {routingMessage || ROUTES.find(route => route.key === form.route)?.description}
          </Typography>
        </ListItem>
        <TemplateSetting
          className={css.fieldWide}
          label="Launch URL Template"
          value={form.launchTemplate}
          disabled={disabled}
          username={form.username}
          type={form.type}
          onChange={value => setForm({ ...form, launchTemplate: value })}
        />
        <TemplateSetting
          className={css.fieldWide}
          label="Copy Command Template"
          value={form.commandTemplate}
          disabled={disabled}
          username={form.username}
          type={form.type}
          onChange={value => setForm({ ...form, commandTemplate: value })}
        />
      </List>
      {thisDevice && (
        <>
          <Divider />
          <List>
            <ListItemCheckbox
              checked={!form.disabled}
              label={form.disabled ? 'Service disabled' : 'Service enabled'}
              subLabel="Disabling your service will take it offline."
              disabled={setupBusy}
              onClick={() => {
                setForm({ ...form, disabled: !form.disabled })
              }}
            />
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
    paddingRight: spacing.xl,
    '& .MuiFormControl-root': { minWidth: 200, marginRight: 100 + spacing.lg },
  },
  fieldWide: {
    paddingLeft: 75,
    paddingRight: spacing.xl,
    '& .MuiFormControl-root': { minWidth: 300, marginRight: spacing.lg },
  },
})
