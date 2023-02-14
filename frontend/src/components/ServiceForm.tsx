import React, { useState, useEffect } from 'react'
import isEqual from 'lodash/isEqual'
import { IP_PRIVATE, DEFAULT_SERVICE, MAX_DESCRIPTION_LENGTH, DEFAULT_CONNECTION } from '../shared/constants'
import { makeStyles } from '@mui/styles'
import { useURLForm } from '../hooks/useURLForm'
import { AddFromNetwork } from './AddFromNetwork'
import { useApplication } from '../hooks/useApplication'
import { ListItemCheckbox } from './ListItemCheckbox'
import { Typography, TextField, List, ListItem, Button } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { ServiceFormApplications } from './ServiceFormApplications'
import { serviceNameValidation } from '../shared/nameHelper'
import { ServiceAttributesForm } from './ServiceAttributesForm'
import { AccordionMenuItem } from './AccordionMenuItem'
import { LoadingMessage } from './LoadingMessage'
import { PortScanIcon } from './PortScanIcon'
import { usePortScan } from '../hooks/usePortScan'
import { validPort } from '../helpers/connectionHelper'
import { findType } from '../models/applicationTypes'
import { Gutters } from './Gutters'
import { spacing } from '../styling'
import { Notice } from './Notice'
import { TestUI } from './TestUI'
import { Pre } from './Pre'

export type ServiceFormProps = {
  service?: IService
  thisDevice: boolean
  editable: boolean
  disabled?: boolean
  adding?: boolean
  onChange?: (form: IService) => void /// swap for URL form?
  onSubmit: (form: IService) => void
  onCancel: () => void
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  thisDevice,
  editable,
  disabled,
  adding,
  onChange,
  onSubmit,
  onCancel,
}) => {
  const { ui } = useDispatch<Dispatch>()
  const { applicationTypes, saving, setupAdded } = useSelector((state: ApplicationState) => ({
    applicationTypes: state.applicationTypes.all,
    saving: !!(state.ui.setupAddingService || (state.ui.setupServiceBusy === service?.id && service?.id)),
    setupAdded: state.ui.setupAdded,
  }))

  const initForm = () => {
    setError(undefined)
    const defaultType = findType(applicationTypes, service?.typeID || setupAdded?.typeID)
    return {
      ...DEFAULT_SERVICE,
      id: service?.id || '',
      host: service?.host || IP_PRIVATE,
      port: service?.port || defaultType.port,
      type: defaultType.name,
      typeID: defaultType.id,
      enabled: !service || service.enabled,
      presenceAddress: service?.presenceAddress,
      name: service?.name || '',
      attributes: service?.attributes || {},
      ...setupAdded,
    }
  }

  const [defaultForm, setDefaultForm] = useState<IService>()
  const [portReachable, portScan] = usePortScan()
  const [error, setError] = useState<string>()
  const [form, setForm] = useState<IService>()
  const application = useApplication(form)
  const [urlField, setUrlField, urlError] = useURLForm(form, setForm, application.urlForm)
  const appType = findType(applicationTypes, form?.typeID)
  const changed = !isEqual(form, defaultForm)
  const css = useStyles()

  disabled = disabled || saving

  useEffect(() => {
    const newForm = initForm()
    setForm(newForm)
    setUrlField(newForm)
    if (!adding) setDefaultForm(structuredClone(newForm))
    if (setupAdded) ui.set({ setupAdded: undefined })
  }, [service])

  useEffect(() => {
    if (form && thisDevice) portScan({ port: form.port, host: form.host })
  }, [form])

  if (!form) return <LoadingMessage />

  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        onSubmit({
          ...form,
          port: form.port || 1,
          name: form.name || serviceNameValidation(appType.name).value,
        })
      }}
    >
      <AccordionMenuItem gutters subtitle="Service Setup" defaultExpanded>
        <List>
          {editable ? (
            <>
              <ServiceFormApplications
                selected={form.typeID}
                disabled={!editable}
                onSelect={type => {
                  const nextForm = {
                    ...form,
                    typeID: type.id,
                    type: type.name,
                    port: type.port,
                    attributes: {
                      ...form.attributes,
                      commandTemplate: undefined,
                      launchTemplate: undefined,
                    },
                  }
                  setForm(nextForm)
                  setUrlField(nextForm)
                }}
              />
              {thisDevice && (
                <ListItem>
                  <Notice
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
                      <>
                        Service found on
                        <b>
                          {form.host}:{form.port}
                        </b>
                      </>
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
              {application.urlForm ? (
                <ListItem className={css.field}>
                  <TextField
                    required
                    value={urlField}
                    label="Service URL"
                    variant="filled"
                    error={!!urlError}
                    disabled={disabled}
                    helperText={urlError}
                    InputLabelProps={{ shrink: true }}
                    onChange={event => {
                      setUrlField(event.target.value)
                      onChange?.(form)
                    }}
                    InputProps={{
                      endAdornment: thisDevice && (
                        <PortScanIcon state={portReachable} port={form.port} host={form.host} />
                      ),
                    }}
                  />
                  <Typography variant="caption">
                    URL of the service you want to connect to. Example: https://localhost:8001/api/dashboard
                  </Typography>
                </ListItem>
              ) : (
                <>
                  <ListItem className={css.field}>
                    <TextField
                      required
                      label="Service Host"
                      value={form.host || ''}
                      disabled={disabled}
                      variant="filled"
                      InputLabelProps={{ shrink: true }}
                      onChange={event => {
                        const host = event.target.value
                        setForm({ ...form, host })
                      }}
                      InputProps={{
                        endAdornment: thisDevice && (
                          <PortScanIcon state={portReachable} port={form.port} host={form.host} />
                        ),
                      }}
                    />
                    <Typography variant="caption">
                      Enter a local network IP address or fully qualified domain name to configure this as a jump
                      service to a system on your local network.
                      <br />
                      <i>AWS example:</i>
                      <b> vpc-domain-name-identifier.region.es.amazonaws.com</b>
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
                      }}
                      InputProps={{
                        endAdornment: thisDevice && (
                          <PortScanIcon state={portReachable} port={form.port} host={form.host} />
                        ),
                      }}
                    />
                    <Typography variant="caption">
                      Port the application's service is running on. Do not change this unless you know it is running on
                      a custom port.
                    </Typography>
                  </ListItem>
                </>
              )}
              <ListItem className={css.field}>
                <TextField
                  label="Service Name"
                  value={form.name || ''}
                  disabled={disabled}
                  error={!!error}
                  variant="filled"
                  helperText={error || ''}
                  InputLabelProps={{ shrink: true }}
                  placeholder={serviceNameValidation(appType.name).value}
                  onChange={event => {
                    const validation = serviceNameValidation(event.target.value, true)
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
                  placeholder="&ndash;"
                  InputLabelProps={{ shrink: true }}
                  onChange={event => {
                    form.attributes.description = event.target.value.substring(0, MAX_DESCRIPTION_LENGTH)
                    setForm({ ...form })
                  }}
                />
                <Typography variant="caption">
                  Service description or connection instructions.
                  <i>Optional</i>
                </Typography>
              </ListItem>
              <TestUI>
                <ListItem className={css.field}>
                  <TextField
                    label="Presence address"
                    value={form.presenceAddress || ''}
                    placeholder="presence.remote.it:443"
                    variant="filled"
                    onChange={event => setForm({ ...form, presenceAddress: event.target.value })}
                  />
                  <Typography variant="caption">Example: presence.remote.it:443</Typography>
                </ListItem>
              </TestUI>
              <ListItemCheckbox
                checked={form.enabled}
                label="Enable service"
                subLabel={
                  <>
                    Disabling your service will take it offline.&nbsp;
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
          ) : (
            <Notice>
              This service isn't remote configurable.
              <em>Update it's device package to the latest version to be able to remote configure it.</em>
            </Notice>
          )}
        </List>
      </AccordionMenuItem>
      <AccordionMenuItem subtitle="Setup connection defaults" gutters>
        <List>
          <ServiceAttributesForm
            connection={{
              ...DEFAULT_CONNECTION,
              ...form.attributes,
              typeID: form.typeID,
            }}
            disabled={disabled}
            attributes={form.attributes}
            onChange={attributes => {
              const result = { ...form, attributes }
              setForm(result)
              setUrlField(result)
            }}
          />
        </List>
      </AccordionMenuItem>
      <Gutters size={adding ? undefined : null} top="lg">
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={disabled || !!error || !changed /*  || fieldError */}
        >
          {saving ? 'Saving...' : changed ? 'Save' : 'Saved'}
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
        {/* <Pre form={form} /> */}
      </Gutters>
    </form>
  )
}

export const useStyles = makeStyles(({ breakpoints }) => ({
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
  [breakpoints.down('sm')]: {
    field: {
      flexDirection: 'column',
      '& > *': { width: '100%' },
      '& > .MuiTypography-root': { margin: spacing.xs, width: '100%', marginBottom: spacing.md },
    },
  },
}))
