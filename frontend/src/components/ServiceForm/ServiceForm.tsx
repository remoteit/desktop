import React, { useState, useEffect } from 'react'
import {
  DEFAULT_TARGET,
  REGEX_VALID_IP,
  REGEX_VALID_HOSTNAME,
  DEFAULT_CONNECTION,
  MAX_DESCRIPTION_LENGTH,
} from '../../shared/constants'
import { makeStyles, Typography, TextField, List, ListItem, MenuItem, Button } from '@material-ui/core'
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
  target?: ITarget
  thisDevice: boolean
  editable: boolean
  onSubmit: (form: IServiceForm) => void
  onCancel: () => void
}

export const ServiceForm: React.FC<Props> = ({
  service,
  target = DEFAULT_TARGET,
  thisDevice,
  editable,
  onSubmit,
  onCancel,
}) => {
  const { backend, ui } = useDispatch<Dispatch>()
  const { applicationTypes, disabled, setupAdded, isValid } = useSelector((state: ApplicationState) => ({
    applicationTypes: state.applicationTypes.all,
    disabled: !!(state.ui.setupBusy || (state.ui.setupServiceBusy === service?.id && service?.id)),
    setupAdded: state.ui.setupAdded,
    isValid: state.backend.reachablePort,
  }))
  const initForm = () => {
    setError(undefined)
    const defaultAppType = findType(applicationTypes, target.type)
    return {
      hostname: service?.host || target.hostname,
      hardwareID: target.hardwareID,
      uid: service?.id || target.uid,
      secret: target.secret,
      port: service?.port || target.port,
      type: service?.typeID || target.type,
      disabled: service?.enabled === undefined ? target.disabled : !service?.enabled,
      name: service?.name || serviceNameValidation(defaultAppType.name).value,
      attributes: service?.attributes || {},
      ...setupAdded,
    }
  }
  const [error, setError] = useState<string>()
  const [form, setForm] = useState<ITarget & IServiceForm>(initForm)
  const appType = findType(applicationTypes, form.type)
  const css = useStyles()

  useEffect(() => {
    setForm(initForm())
  }, [service])

  useEffect(() => {
    checkPort()
    if (setupAdded) ui.set({ setupAdded: undefined })
  }, [form?.port, form?.hostname])

  const checkPort = () => {
    if (
      REGEX_VALID_IP.test(`${form.hostname}:${form.port}`) ||
      REGEX_VALID_HOSTNAME.test(`${form.hostname}:${form.port}`)
    ) {
      backend.set({ reachablePortLoading: true })
      emit('reachablePort', { port: form.port, host: form.hostname })
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
              value={form.type}
              disabled={disabled}
              variant="filled"
              onChange={event => {
                const type = Number(event.target.value)
                const updatedAppType = findType(applicationTypes, type)
                setForm({
                  ...form,
                  type,
                  port: findType(applicationTypes, type).port || 0,
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
                label="Service Host Address"
                value={form.hostname}
                disabled={disabled}
                variant="filled"
                onChange={event => setForm({ ...form, hostname: event.target.value })}
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
            checked={!form.disabled}
            label="Enable service"
            subLabel={
              <>
                Disabling your service will take it offline.{' '}
                <i>
                  Service is
                  {form.disabled ? ' disabled' : ' enabled'}
                </i>
              </>
            }
            disabled={disabled}
            onClick={() => {
              setForm({ ...form, disabled: !form.disabled })
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
              typeID: form.type,
            }}
            disabled={disabled}
            attributes={form.attributes}
            onUpdate={attributes => setForm({ ...form, attributes })}
          />
        </List>
      </AccordionMenuItem>
      <Gutters>
        <Button type="submit" variant="contained" color="primary" disabled={disabled || !!error}>
          {disabled ? 'Saving...' : 'Save'}
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </Gutters>
    </form>
  )
}

export const useStyles = makeStyles({
  field: {
    paddingRight: spacing.xl,
    alignItems: 'flex-start',
    '& .MuiFormControl-root': { minWidth: 300, marginRight: spacing.lg },
  },
  fieldSub: {
    padding: `0 ${spacing.xl}px 0 ${spacing.xxs}px`,
    '& .MuiFormControl-root': {
      minWidth: 300 - spacing.lg,
      display: 'block',
    },
    '& .MuiFormControl-root + .MuiFormControl-root': {
      marginTop: spacing.sm,
    },
  },
})
