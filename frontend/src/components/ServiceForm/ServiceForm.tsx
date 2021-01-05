import React, { useState, useEffect } from 'react'
import { DEFAULT_TARGET, REGEX_VALID_IP, REGEX_VALID_HOSTNAME } from '../../shared/constants'
import { makeStyles, Divider, Typography, TextField, List, ListItem, MenuItem, Button } from '@material-ui/core'
import { useHistory, useLocation } from 'react-router-dom'
import { Dispatch } from '../../store'
import { AddFromNetwork } from '../AddFromNetwork'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { ApplicationState } from '../../store'
import { DEFAULT_CONNECTION } from '../../helpers/connectionHelper'
import { useDispatch, useSelector } from 'react-redux'
import { ServiceAttributesForm } from '../ServiceAttributesForm'
import { serviceNameValidation } from '../../shared/nameHelper'
import { findType } from '../../models/applicationTypes'
import { Columns } from '../Columns'
import { spacing } from '../../styling'
import { Notice } from '../Notice'
import { emit } from '../../services/Controller'
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

export const ServiceForm: React.FC<Props> = ({ service, target = DEFAULT_TARGET, thisDevice, onSubmit, onCancel }) => {
  const { backend } = useDispatch<Dispatch>()
  const history = useHistory()
  const location = useLocation()
  const { applicationTypes, setupBusy, setupAdded, deleting, isValid, scanEnabled } = useSelector(
    (state: ApplicationState) => ({
      applicationTypes: state.applicationTypes.all,
      setupBusy: state.ui.setupBusy,
      setupAdded: state.ui.setupAdded,
      deleting: state.ui.setupServiceBusy === target?.uid,
      isValid: state.backend.reachablePort,
      scanEnabled: state.ui.scanEnabled,
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
      type="light"
      size="md"
      color={isValid ? 'success' : 'warning'}
      fixedWidth
    />
  )

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
                  endAdornment: <CheckIcon />,
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
                  endAdornment: <CheckIcon />,
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
                    <AddFromNetwork deviceId={target.uid} thisDevice={thisDevice} />
                  </>
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
    '& .MuiFormControl-root': { minWidth: 200, marginRight: 100 + spacing.lg },
  },
  fieldWide: {
    paddingLeft: 75,
    paddingRight: spacing.xl,
    '& .MuiFormControl-root': { minWidth: 300, marginRight: spacing.lg },
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
})
