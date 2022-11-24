import React, { useState, useEffect } from 'react'
import isEqual from 'lodash/isEqual'
import cloneDeep from 'lodash/cloneDeep'
import { IP_PRIVATE, DEFAULT_SERVICE, MAX_DESCRIPTION_LENGTH } from '../shared/constants'
import { makeStyles } from '@mui/styles'
import { AddFromNetwork } from './AddFromNetwork'
import { ListItemCheckbox } from './ListItemCheckbox'
import { Typography, TextField, List, ListItem, MenuItem, Button } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { serviceNameValidation } from '../shared/nameHelper'
import { PortScanIcon } from './PortScanIcon'
import { usePortScan } from '../hooks/usePortScan'
import { validPort } from '../helpers/connectionHelper'
import { findType } from '../models/applicationTypes'
import { Gutters } from './Gutters'
import { spacing } from '../styling'
import { Notice } from './Notice'

export type ServiceFormProps = {
  service?: IService
  thisDevice: boolean
  editable: boolean
  disabled?: boolean
  adding?: boolean
  onChange?: (form: IServiceForm) => void
  onSubmit: (form: IServiceForm) => void
  onCancel: () => void
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  thisDevice,
  editable,
  disabled,
  adding,
  onSubmit,
  onCancel,
}) => {
  const { ui } = useDispatch<Dispatch>()
  const { applicationTypes, saving, setupAdded } = useSelector((state: ApplicationState) => ({
    applicationTypes: state.applicationTypes.all,
    saving: !!(state.ui.setupBusy || (state.ui.setupServiceBusy === service?.id && service?.id)),
    setupAdded: state.ui.setupAdded,
  }))
  const initForm = () => {
    setError(undefined)
    const defaultType = findType(applicationTypes, service?.typeID || setupAdded?.typeID)
    return {
      ...DEFAULT_SERVICE,
      host: service?.host || IP_PRIVATE,
      id: service?.id || '',
      port: service?.port || defaultType.port,
      type: defaultType.name,
      typeID: defaultType.id,
      enabled: !service || service.enabled,
      name: service?.name || serviceNameValidation(defaultType.name).value,
      attributes: service?.attributes || {},
      ...setupAdded,
    }
  }
  const [defaultForm, setDefaultForm] = useState<IServiceForm>()
  const [error, setError] = useState<string>()
  const [form, setForm] = useState<IServiceForm>()
  const [portReachable, portScan] = usePortScan()
  const appType = findType(applicationTypes, form?.typeID)
  const css = useStyles()
  const changed = !isEqual(form, defaultForm)

  disabled = disabled || saving

  useEffect(() => {
    const newForm = initForm()
    setForm(newForm)
    portScan({ port: newForm.port, host: newForm.host })
    if (!adding) setDefaultForm(cloneDeep(newForm))
    if (setupAdded) ui.set({ setupAdded: undefined })
  }, [service])

  if (!form) return null

  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        onSubmit({ ...form, port: form.port || 1 })
      }}
    >
      <List>
        <ListItem className={css.field}>
          <TextField
            required
            label="Service Name"
            value={form.name}
            disabled={disabled}
            error={!!error}
            variant="filled"
            helperText={error || ''}
            placeholder={appType.name}
            onChange={event => {
              const validation = serviceNameValidation(event.target.value)
              setForm({ ...form, name: validation.value })
              validation.error ? setError(validation.error) : setError(undefined)
            }}
          />
        </ListItem>
        <ListItem className={css.field}>
          <TextField
            multiline
            label="Service Description"
            value={form.attributes.description || ''}
            disabled={disabled}
            variant="filled"
            onChange={event => {
              form.attributes.description = event.target.value.substring(0, MAX_DESCRIPTION_LENGTH)
              setForm({ ...form })
            }}
          />
          <Typography variant="caption">
            <i>Optional</i>
            <br />
            Service description or connection instructions.
          </Typography>
        </ListItem>
        {editable && (
          <>
            <ListItem className={css.field}>
              <TextField
                select
                label="Service Type"
                value={form.typeID}
                disabled={disabled}
                variant="filled"
                onChange={event => {
                  const typeID = Number(event.target.value)
                  const updatedAppType = findType(applicationTypes, typeID)
                  setForm({
                    ...form,
                    typeID: typeID,
                    port: findType(applicationTypes, typeID).port || 0,
                    name: serviceNameValidation(updatedAppType.name).value,
                    attributes: {
                      ...form.attributes,
                      commandTemplate: undefined,
                      launchTemplate: undefined,
                    },
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
                required
                label="Service Port"
                value={form.port || ''}
                disabled={disabled}
                variant="filled"
                onChange={event => {
                  const port = validPort(event)
                  setForm({ ...form, port })
                  thisDevice && portScan({ port, host: form.host })
                }}
                InputProps={{
                  endAdornment: thisDevice && <PortScanIcon state={portReachable} port={form.port} host={form.host} />,
                }}
              />
              <Typography variant="caption">
                Port the application's service is running on. Do not change this unless you know it is running on a
                custom port.
              </Typography>
            </ListItem>
            <ListItem className={css.field}>
              <TextField
                required
                label="Service Host"
                value={form.host}
                disabled={disabled}
                variant="filled"
                onChange={event => {
                  const host = event.target.value
                  setForm({ ...form, host })
                  thisDevice && portScan({ port: form.port, host })
                }}
                InputProps={{
                  endAdornment: thisDevice && <PortScanIcon state={portReachable} port={form.port} host={form.host} />,
                }}
              />
              <Typography variant="caption">
                Enter a local network IP address or fully qualified domain name to configure this as a jump service to a
                system on your local network.
                <br />
                <i>AWS example:</i>
                <b> vpc-domain-name-identifier.region.es.amazonaws.com</b>
              </Typography>
            </ListItem>
            {thisDevice && (
              <ListItem>
                <Notice
                  fullWidth
                  severity={portReachable === 'REACHABLE' ? 'success' : 'warning'}
                  button={
                    portReachable === 'REACHABLE' ? undefined : (
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => portScan({ port: form.port, host: form.host })}
                      >
                        Retry
                      </Button>
                    )
                  }
                >
                  {portReachable === 'REACHABLE' ? (
                    `Service found on ${form.host}:${form.port}!`
                  ) : (
                    <>
                      No service found running on {form.host}:{form.port}.
                      <AddFromNetwork allowScanning={thisDevice} />
                      <em>Double check that the host application running.</em>
                    </>
                  )}
                </Notice>
              </ListItem>
            )}
            {appType.proxy && (
              <ListItem className={css.field}>
                <TextField
                  label="Target Host Name"
                  value={form.attributes.targetHost || ''}
                  disabled={disabled}
                  variant="filled"
                  onChange={event =>
                    setForm({ ...form, attributes: { ...form.attributes, targetHost: event.target.value.toString() } })
                  }
                />
                <Typography variant="caption">
                  <i>Optional. </i>
                  Override the target host name when accessing this service. Needed by host name dependant web sites.{' '}
                  <i>
                    Example
                    <b> webui.company.com</b> or <b>google.com</b>
                  </i>
                </Typography>
              </ListItem>
            )}
            <ListItemCheckbox
              checked={form.enabled}
              label="Enable service"
              subLabel={
                <>
                  Disabling your service will take it offline.{' '}
                  <i>
                    Service is
                    {form.enabled ? ' enabled' : ' disabled'}
                  </i>
                </>
              }
              disabled={disabled}
              onClick={() => setForm({ ...form, enabled: !form.enabled })}
            />
          </>
        )}
      </List>
      {/* Connection defaults form? */}
      <Gutters>
        <Button type="submit" variant="contained" color="primary" disabled={disabled || !!error || !changed}>
          {saving ? 'Saving...' : changed ? 'Save' : 'Saved'}
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </Gutters>
    </form>
  )
}

export const useStyles = makeStyles({
  field: {
    paddingRight: spacing.lg,
    paddingLeft: spacing.md,
    alignItems: 'flex-start',
    '& > *': {
      width: '50%',
      maxWidth: 400,
    },
    '& > .MuiTypography-root': {
      width: `calc(50% - ${spacing.lg}px)`,
      marginLeft: spacing.lg,
    },
  },
  fieldSub: {
    padding: `0 ${spacing.lg}px 0 ${spacing.md}px`,
    '& .MuiFormControl-root + .MuiFormControl-root': { marginTop: spacing.sm },
    '& > *': {
      width: '50%',
      maxWidth: 400,
    },
  },
})
