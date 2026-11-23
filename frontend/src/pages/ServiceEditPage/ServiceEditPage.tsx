import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { REGEX_LAST_PATH } from '../../constants'
import { ListItemBack } from '../../components/ListItemBack'
import { ServiceForm } from '../../components/ServiceForm'
import { Gutters } from '../../components/Gutters'
import { ServiceSchemeSuggestion } from '../../components/ServiceSchemeSuggestion'
import { ListItem, ListItemText } from '@mui/material'
import { useServiceApp } from '../../hooks/useDeviceApps'
import { isAppService } from '../../helpers/appsHelper'
import { servicesConfigurable } from '../../helpers/virtualDeviceHelper'

type Props = { device?: IDevice }

export const ServiceEditPage: React.FC<Props> = ({ device }) => {
  const { t } = useTranslation()
  const { thisId } = useSelector((state: State) => state.backend)
  const { serviceID } = useParams<{ serviceID?: string }>()
  const dispatch = useDispatch<Dispatch>()
  const service = device?.services.find(s => s.id === serviceID)
  const hostedByApp = isAppService(service)
  const { app, appService } = useServiceApp(device, service)
  const thisDevice = service?.deviceID === thisId
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    dispatch.applicationTypes.fetchAll()
  }, [])

  if (!service) {
    history.push(`/devices/${device?.id}`)
    return null
  }

  const exit = () => history.push(location.pathname.replace(REGEX_LAST_PATH, ''))
  const listeners = (
    appService?.listeners.length ? appService.listeners : app?.serviceId === service.id ? [{ name: null }] : []
  ).flatMap(({ name }) => {
    const listen = name ? app?.listeners?.find(listener => listener.name === name)?.listen : app?.listen
    return listen ? [{ name, listen }] : []
  })
  const listenerDetails = hostedByApp && (
    <>
      <ListItem>
        <ListItemText primary={t('serviceEditPage.hostedOn', 'Hosted on')} secondary={device?.name} />
      </ListItem>
      {listeners?.length ? (
        listeners.map(({ name, listen }) => {
          const [type, port] = listen.split(':')
          const location =
            type === 'unix'
              ? t('serviceEditPage.unixSocket', 'Local socket')
              : type === 'stdio'
              ? t('serviceEditPage.standardIO', 'Standard input and output')
              : `127.0.0.1:${port} (${type.toUpperCase()})`
          return (
            <ListItem key={name ?? listen}>
              <ListItemText primary={name || t('serviceEditPage.listener', 'Listener')} secondary={location} />
            </ListItem>
          )
        })
      ) : (
        <ListItem>
          <ListItemText
            primary={t('serviceEditPage.listener', 'Listener')}
            secondary={t('serviceEditPage.listenerUnavailable', 'Waiting for the device to report its listener')}
          />
        </ListItem>
      )}
    </>
  )

  return (
    <Gutters size="md" bottom={null}>
      <ListItemBack title={t('serviceEditPage.title', 'Service configuration')} to="connect" />
      {!hostedByApp && <ServiceSchemeSuggestion device={device} service={service} />}
      <ServiceForm
        device={device}
        service={service}
        thisDevice={thisDevice}
        editable={servicesConfigurable(device) || thisDevice}
        listenerDetails={listenerDetails}
        disabled={!device?.permissions.includes('MANAGE')}
        onCancel={exit}
        onSubmit={async form => {
          dispatch.ui.set({ setupServiceBusy: form.id })
          if (device?.permissions.includes('MANAGE')) {
            const updatedService = structuredClone(service)
            updatedService.attributes = { ...service.attributes, ...form.attributes }
            await dispatch.devices.setServiceAttributes(updatedService)
            if (servicesConfigurable(device) && !hostedByApp) {
              await dispatch.devices.cloudUpdateService({ form, deviceId: device.id, ports: form.ports })
            } else {
              await dispatch.devices.rename({ id: service.id, name: form.name })
              await dispatch.devices.fetchSingleFull({ id: device.id, hidden: true })
            }
          }
          dispatch.ui.set({ setupServiceBusy: undefined })
        }}
      />
    </Gutters>
  )
}
