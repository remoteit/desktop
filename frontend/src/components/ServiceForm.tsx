import React, { useState, useEffect } from 'react'
import isEqual from 'lodash.isequal'
import structuredClone from '@ungap/structured-clone'
import { useTranslation } from 'react-i18next'
import { MAX_DESCRIPTION_LENGTH } from '../constants'
import { IP_PRIVATE, DEFAULT_SERVICE, DEFAULT_CONNECTION } from '@common/constants'
import { Typography, TextField, List, ListItem, Button, Theme } from '@mui/material'
import { useURLForm } from '../hooks/useURLForm'
import { AddFromNetwork } from './AddFromNetwork'
import { useApplication } from '../hooks/useApplication'
import { State, Dispatch } from '../store'
import { ListItemCheckbox } from './ListItemCheckbox'
import { useDispatch, useSelector } from 'react-redux'
import { ServiceFormApplications } from './ServiceFormApplications'
import { serviceNameValidation } from '@common/nameHelper'
import { ServiceAttributesForm } from './ServiceAttributesForm'
import { AccordionMenuItem } from './AccordionMenuItem'
import { LoadingMessage } from './LoadingMessage'
import { PortScanIcon } from './PortScanIcon'
import { usePortScan } from '../hooks/usePortScan'
import { validPort } from '../helpers/connectionHelper'
import { findType } from '../models/applicationTypes'
import { Gutters } from './Gutters'
import { spacing, Sizes } from '../styling'
import { Notice } from './Notice'

export type ServiceFormProps = {
  device?: IDevice
  service?: IService
  thisDevice: boolean
  editable: boolean
  disabled?: boolean
  adding?: boolean
  compact?: boolean
  actionGuttersSize?: Sizes | null
  onChange?: (form: IService) => void /// swap for URL form?
  onSubmit: (form: IService) => void
  onCancel: () => void
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  device,
  service,
  thisDevice,
  editable,
  disabled,
  adding,
  compact,
  actionGuttersSize = 'xxs',
  onChange,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation()
  const { ui } = useDispatch<Dispatch>()
  const applicationTypes = useSelector((state: State) => state.applicationTypes.all)
  const saving = useSelector(
    (state: State) => !!(state.ui.setupAddingService || (service?.id && state.ui.setupServiceBusy === service.id))
  )
  const setupAdded = useSelector((state: State) => state.ui.setupAdded)

  const initForm = () => {
    setError(undefined)
    const defaultType = findType(applicationTypes, service?.typeID || setupAdded?.typeID || (adding ? 8 : undefined))
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
      attributes: service ? { ...service.attributes } : {},
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

  disabled = disabled || saving

  useEffect(() => {
    const newForm = initForm()
    setForm(newForm)
    setUrlField(newForm)
    if (!adding) setDefaultForm(structuredClone(newForm))
    if (setupAdded) ui.set({ setupAdded: undefined })
  }, [service?.id])

  useEffect(() => {
    if (form && thisDevice) portScan({ port: form.port, host: form.host })
  }, [form])

  if (!form) return <LoadingMessage />

  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        const newForm = {
          ...structuredClone(form),
          port: form.port || 1,
          name: form.name || serviceNameValidation(appType.name).value,
        }
        onSubmit(newForm)
        setDefaultForm(newForm)
      }}
    >
      <AccordionMenuItem gutters subtitle={t('serviceForm.serviceSetup', 'Service Setup')} defaultExpanded>
        <List>
          {editable && (
            <>
              <ServiceFormApplications
                device={device}
                applicationTypes={applicationTypes}
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
              {appType.description && (
                <ListItem>
                  <Notice>
                    <em>
                      <strong>{appType.description}</strong> - {application.use}
                    </em>
                  </Notice>
                </ListItem>
              )}
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
                          {t('serviceForm.retry', 'Retry')}
                        </Button>
                      )
                    }
                  >
                    {portReachable === 'REACHABLE' ? (
                      <>
                        {t('serviceForm.serviceFoundOn', 'Service found on')}&nbsp;
                        <b>
                          {form.host}:{form.port}
                        </b>
                      </>
                    ) : (
                      <>
                        {t('serviceForm.noServiceFoundOn', {
                          host: form.host,
                          port: form.port,
                          defaultValue: 'No service found running on {{host}}:{{port}}.',
                        })}
                        <AddFromNetwork allowScanning={thisDevice} />
                        <em>{t('serviceForm.doubleCheckRunning', 'Double check that the host application running.')}</em>
                      </>
                    )}
                  </Notice>
                </ListItem>
              )}
              {application.urlForm ? (
                <ListItem sx={fieldSx}>
                  <TextField
                    required
                    value={urlField}
                    label={t('serviceForm.serviceUrl', 'Service URL')}
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
                    {t('serviceForm.serviceUrlHelp', 'Full URL of the service you want to connect to. Example:')}{' '}
                    <b>https://localhost:8001/api/dashboard</b> {t('serviceForm.or', 'or')}
                    <b> http://192.168.1.68/ui/login</b>.
                  </Typography>
                </ListItem>
              ) : (
                <>
                  <ListItem sx={fieldSx}>
                    <TextField
                      required
                      label={t('serviceForm.serviceHost', 'Service Host')}
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
                      {t(
                        'serviceForm.serviceHostHelp',
                        'Enter a local network IP address or fully qualified domain name to configure this as a jump service to a system on your local network.'
                      )}
                      <br />
                      <i>{t('serviceForm.awsExample', 'AWS example:')}</i>
                      <b> vpc-domain-name-identifier.region.es.amazonaws.com</b>
                    </Typography>
                  </ListItem>
                  <ListItem sx={fieldSx}>
                    <TextField
                      required
                      label={t('serviceForm.servicePort', 'Service Port')}
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
                      {t(
                        'serviceForm.servicePortHelp',
                        "Port the application's service is running on. Do not change this unless you know it is running on a custom port."
                      )}
                    </Typography>
                  </ListItem>
                </>
              )}
            </>
          )}
          <ListItem sx={fieldSx}>
            <TextField
              label={t('serviceForm.serviceName', 'Service Name')}
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
          {!compact && (
            <ListItem sx={fieldSx}>
              <TextField
                multiline
                label={t('serviceForm.serviceDescription', 'Service Description')}
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
                {t('serviceForm.serviceDescriptionHelp', 'Service description or connection instructions.')}
                <i>{t('serviceForm.optional', 'Optional')}</i>
              </Typography>
            </ListItem>
          )}
          {editable ? (
            <ListItemCheckbox
              checked={form.enabled}
              label={t('serviceForm.enableService', 'Enable service')}
              subLabel={
                <>
                  {t('serviceForm.disableServiceHelp', 'Disabling your service will take it offline.')}&nbsp;
                  <i>
                    {form.enabled
                      ? t('serviceForm.serviceIsEnabled', 'Service is enabled')
                      : t('serviceForm.serviceIsDisabled', 'Service is disabled')}
                  </i>
                </>
              }
              disabled={disabled}
              onClick={() => setForm({ ...form, enabled: !form.enabled })}
            />
          ) : (
            <ListItem>
              <Notice>
                {t('serviceForm.notRemoteConfigurable', "This service isn't remote configurable.")}
                <em>
                  {t(
                    'serviceForm.updatePackageHelp',
                    "Update it's device package to the latest version to be able to remote configure it."
                  )}
                </em>
              </Notice>
            </ListItem>
          )}
        </List>
      </AccordionMenuItem>
      {!compact && (
        <AccordionMenuItem subtitle={t('serviceForm.setupConnectionDefaults', 'Setup connection defaults')} gutters>
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
      )}
      <Gutters size={actionGuttersSize} top="lg">
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={disabled || !!error || !changed /*  || fieldError */}
        >
          {saving
            ? t('common.saving', 'Saving...')
            : changed
            ? t('common.save', 'Save')
            : t('common.saved', 'Saved')}
        </Button>
        <Button onClick={onCancel}>{t('common.cancel', 'Cancel')}</Button>
        {/* <Pre form={form} /> */}
      </Gutters>
    </form>
  )
}

export const fieldSx = (theme: Theme) => ({
  paddingRight: `${spacing.lg}px`,
  paddingLeft: `${spacing.md}px`,
  alignItems: 'flex-start',
  '& > *': {
    width: '50%',
    maxWidth: 400,
  },
  '& > span.MuiTypography-root': {
    width: `calc(50% - ${spacing.lg}px)`,
    marginLeft: `${spacing.lg}px`,
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    '& > *': { width: '100%' },
    '& > span.MuiTypography-root': { margin: `${spacing.xs}px`, width: '100%', marginBottom: `${spacing.md}px` },
  },
})
