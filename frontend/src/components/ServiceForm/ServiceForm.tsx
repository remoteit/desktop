import React, { useState, useEffect } from 'react'
import { makeStyles, Divider, Typography, TextField, List, ListItem, MenuItem, Button, Box } from '@material-ui/core'
import { Dispatch } from '../../store'
import { DEFAULT_CONNECTION } from '../../helpers/connectionHelper'
import { useDispatch, useSelector } from 'react-redux'
import { DEFAULT_TARGET } from '../../shared/constants'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { ApplicationState } from '../../store'
import { ServiceAttributesForm } from '../ServiceAttributesForm'
import { serviceNameValidation } from '../../shared/nameHelper'
import { findType } from '../../models/applicationTypes'
import { Columns } from '../Columns'
import { spacing, colors } from '../../styling'
import { emit } from '../../services/Controller'
import { Notice } from '../Notice'
import { Icon } from '../Icon'

type IServiceForm = ITarget & {
  name: string
  attributes: IService['attributes']
}

type Props = {
  service?: IService
  target?: ITarget
  thisDevice: boolean
  onSubmit: (IServiceForm) => void
  onCancel: () => void
}

const NOTICE = {
  warning: 'No service found running on specified port and hot address',
  success: 'Service found on port and host address!',
}

export const ServiceForm: React.FC<Props> = ({ service, target = DEFAULT_TARGET, thisDevice, onSubmit, onCancel }) => {
  const { backend } = useDispatch<Dispatch>()
  const { applicationTypes, setupBusy, setupAdded, deleting, isValid, loading } = useSelector(
    (state: ApplicationState) => ({
      applicationTypes: state.applicationTypes.all,
      setupBusy: state.ui.setupBusy,
      setupAdded: state.ui.setupAdded,
      deleting: state.ui.setupServiceBusy === target?.uid,
      isValid: state.backend.reachablePort,
      loading: state.backend.loading,
    })
  )
  const disabled = setupBusy || deleting
  const [error, setError] = useState<string>()
  const [form, setForm] = useState<ITarget & IServiceForm>(() => {
    const defaultAppType = findType(applicationTypes, target.type)
    return {
      ...target,
      name: service?.name || serviceNameValidation(defaultAppType.description).value,
      attributes: service?.attributes || {},
      ...setupAdded,
    }
  })
  const appType = findType(applicationTypes, form.type)
  const css = useStyles()

  const IPAndPort = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/

  const checkPort = () => {
    console.log(IPAndPort.test(`${form.hostname}:${form.port}`))
    if (IPAndPort.test(`${form.hostname}:${form.port}`)) {
      backend.set({ loading: true })
      emit('reachablePort', { port: form.port, host: form?.hostname })
    } else {
      backend.set({ reachablePort: false })
    }
  }

  const checkIcon = () => {
    let icon = isValid ? 'check-circle' : 'exclamation-triangle'
    if (loading) icon = 'spinner-third'
    return <Icon name={icon} type="light" size="md" color={isValid ? 'success' : 'warning'} spin={loading} fixedWidth />
  }

  useEffect(() => {
    checkPort()
  }, [form?.port, form?.hostname])

  return (
    <form onSubmit={() => onSubmit({ ...form, port: form.port || 1 })}>
      {thisDevice && (
        <>
          <List>
            <ListItem className={css.field}>
              <TextField
                select
                autoFocus
                size="small"
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
                    name: serviceNameValidation(updatedAppType.description).value,
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
                size="small"
                label="Service Port"
                value={form.port}
                disabled={disabled}
                variant="filled"
                onChange={event => setForm({ ...form, port: +event.target.value })}
                InputProps={{
                  endAdornment: checkIcon(),
                }}
              />
            </ListItem>
            <ListItem className={css.fieldWide}>
              <TextField
                size="small"
                label="Service Host Address"
                value={form.hostname}
                disabled={disabled}
                variant="filled"
                onChange={event => setForm({ ...form, hostname: event.target.value })}
                InputProps={{
                  endAdornment: checkIcon(),
                }}
              />
              <Typography variant="caption">
                Local network IP address or fully qualified domain name to host this service. Leave blank for this
                system to host.
                <br />
                <i>AWS example:</i>
                <b> vpc-domain-name-identifier.region.es.amazonaws.com</b>
              </Typography>
            </ListItem>
            <ListItem className={css.fieldWide}>
              <Notice fullWidth severity={isValid ? 'success' : 'warning'}>
                <Box>{isValid ? NOTICE.success : NOTICE.warning} </Box>
                {!isValid && (
                  <Button className={css.retry} onClick={checkPort}>
                    Retry
                  </Button>
                )}
              </Notice>
            </ListItem>
          </List>
          <Divider />
        </>
      )}
      <List>
        <ListItem className={css.fieldWide}>
          <TextField
            size="small"
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
        <ServiceAttributesForm
          className={css.fieldWide}
          subClassName={css.fieldSub}
          connection={{
            ...DEFAULT_CONNECTION,
            ...form.attributes,
            typeID: form.type,
          }}
          disabled={disabled}
          attributes={form.attributes}
          setAttributes={attributes => setForm({ ...form, attributes })}
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
    '& .MuiFormControl-root': { minWidth: 206, marginRight: 140 },
  },
  fieldWide: {
    paddingLeft: 75,
    paddingRight: spacing.xl,
    '& .MuiFormControl-root': {
      minWidth: 300,
      marginRight: 45,
    },
  },
  fieldSub: {
    padding: `0 ${spacing.xl}px 0 75px`,
    '& .MuiFormControl-root': {
      minWidth: 300 - spacing.lg,
      display: 'block',
    },
    '& .MuiFormControl-root + .MuiFormControl-root': {
      marginTop: spacing.sm,
    },
  },
  retry: {
    color: colors.primary,
    height: spacing.lg,
    paddingTop: spacing.sm,
  },
})
