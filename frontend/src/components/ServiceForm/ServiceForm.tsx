import React, { useState, useEffect } from 'react'
import {
  IP_PRIVATE,
  DEFAULT_SERVICE,
  REGEX_VALID_IP,
  REGEX_VALID_HOSTNAME,
  DEFAULT_CONNECTION,
  MAX_DESCRIPTION_LENGTH,
} from '../../shared/constants'
import { makeStyles } from '@mui/styles'
import { Typography, TextField, List, ListItem, MenuItem, Button } from '@mui/material'
import { Dispatch } from '../../store'
import { AddFromNetwork } from '../AddFromNetwork'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { serviceNameValidation } from '../../shared/nameHelper'
import { ServiceAttributesForm } from '../ServiceAttributesForm'
import { AccordionMenuItem } from '../AccordionMenuItem'
import { validPort } from '../../helpers/connectionHelper'
import { findType } from '../../models/applicationTypes'
import { Gutters } from '../Gutters'
import { spacing } from '../../styling'
import { Notice } from '../Notice'
import { emit } from '../../services/Controller'
import { Icon } from '../Icon'

type Props = {
  service?: IService
  thisDevice: boolean
  editable: boolean
  disabled?: boolean
  onSubmit: (form: IServiceForm) => void
  onCancel: () => void
}

export const ServiceForm: React.FC<Props> = ({ service, thisDevice, editable, disabled, onSubmit, onCancel }) => {
  const { backend, ui } = useDispatch<Dispatch>()
  const { applicationTypes, saving, setupAdded, isValid } = useSelector((state: ApplicationState) => ({
    applicationTypes: state.applicationTypes.all,
    saving: !!(state.ui.setupBusy || (state.ui.setupServiceBusy === service?.id && service?.id)),
    setupAdded: state.ui.setupAdded,
    isValid: state.backend.reachablePort,
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
  const [error, setError] = useState<string>()
  const [form, setForm] = useState<IServiceForm>(initForm)
  const appType = findType(applicationTypes, form.typeID)
  const css = useStyles()

  disabled = disabled || saving

  useEffect(() => {
    setForm(initForm())
  }, [service])

  useEffect(() => {
    checkPort()
    if (setupAdded) ui.set({ setupAdded: undefined })
  }, [form?.port, form?.host])

  const checkPort = () => {
    if (REGEX_VALID_IP.test(`${form.host}:${form.port}`) || REGEX_VALID_HOSTNAME.test(`${form.host}:${form.port}`)) {
      backend.set({ reachablePortLoading: true })
      emit('reachablePort', { port: form.port, host: form.host })
    } else {
      backend.set({ reachablePort: false })
    }
  }

  const CheckIcon = () => (
    <Icon
      name={isValid ? 'check-circle' : 'exclamation-triangle'}
      size="md"
      color={isValid ? 'success' : 'warning'}
      fixedWidth
    />
  )

  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        onSubmit({ ...form, port: form.port || 1 })
      }}
    >
      <List>
        {editable && (
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
        )}
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
                required
                label="Service Port"
                value={form.port || ''}
                disabled={disabled}
                variant="filled"
                onChange={event => setForm({ ...form, port: validPort(event) })}
                InputProps={{
                  endAdornment: thisDevice && <CheckIcon />,
                }}
              />
            </ListItem>
            <ListItem className={css.field}>
              <TextField
                required
                label="Service Host"
                value={form.host}
                disabled={disabled}
                variant="filled"
                onChange={event => setForm({ ...form, host: event.target.value })}
                InputProps={{
                  endAdornment: thisDevice && <CheckIcon />,
                }}
              />
              <Typography variant="caption">
                Do not change if hosting a local service. Use a local network IP address or fully qualified domain name
                to configure this as a jump service to system on your local network.
                <br />
                <i>AWS example:</i>
                <b> vpc-domain-name-identifier.region.es.amazonaws.com</b>
              </Typography>
            </ListItem>
            {thisDevice && (
              <ListItem className={css.field}>
                <Notice
                  fullWidth
                  severity={isValid ? 'success' : 'warning'}
                  button={
                    isValid ? undefined : (
                      <Button size="small" color="primary" onClick={checkPort}>
                        Retry
                      </Button>
                    )
                  }
                >
                  {isValid ? (
                    'Service found on port and host address!'
                  ) : (
                    <>
                      No service found running on port and host address.
                      <AddFromNetwork allowScanning={thisDevice} />
                    </>
                  )}
                </Notice>
              </ListItem>
            )}
          </>
        )}
        {editable && (
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
            onClick={() => {
              setForm({ ...form, enabled: !form.enabled })
            }}
          />
        )}
      </List>
      <AccordionMenuItem subtitle="Connection defaults" gutters>
        <List>
          <ServiceAttributesForm
            connection={{
              ...DEFAULT_CONNECTION,
              ...form.attributes,
              typeID: form.typeID,
            }}
            disabled={disabled}
            attributes={form.attributes}
            onUpdate={attributes => setForm({ ...form, attributes })}
          />
        </List>
      </AccordionMenuItem>
      <Gutters>
        <Button type="submit" variant="contained" color="primary" disabled={disabled || !!error}>
          {saving ? 'Saving...' : 'Save'}
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
    '& .MuiFormControl-root': { minWidth: 300, marginRight: spacing.lg },
  },
  fieldSub: {
    padding: `0 ${spacing.lg}px 0 ${spacing.md}px`,
    '& .MuiFormControl-root': {
      minWidth: 300 - spacing.lg,
      width: 300 - spacing.lg,
      display: 'block',
      marginRight: spacing.lg,
    },
    '& .MuiFormControl-root + .MuiFormControl-root': {
      marginTop: spacing.sm,
    },
  },
})
