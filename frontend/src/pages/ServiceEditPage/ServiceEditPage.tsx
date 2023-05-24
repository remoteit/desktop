import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { ListItemBack } from '../../components/ListItemBack'
import { ServiceForm } from '../../components/ServiceForm'
import { Gutters } from '../../components/Gutters'

type Props = { device?: IDevice }

export const ServiceEditPage: React.FC<Props> = ({ device }) => {
  const { thisId } = useSelector((state: ApplicationState) => state.backend)
  const { serviceID } = useParams<{ serviceID?: string }>()
  const dispatch = useDispatch<Dispatch>()
  const service = device?.services.find(s => s.id === serviceID)
  const thisDevice = service?.deviceID === thisId
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    dispatch.applicationTypes.fetch()
  }, [])

  if (!service) {
    history.push(`/devices/${device?.id}`)
    return null
  }

  const exit = () => history.push(location.pathname.replace(REGEX_LAST_PATH, ''))

  return (
    <>
      <Gutters size="md" bottom={null}>
        <ListItemBack title="Service configuration" />
        <ServiceForm
          service={service}
          thisDevice={thisDevice}
          editable={!!device?.configurable || thisDevice}
          disabled={!device?.permissions.includes('MANAGE')}
          onCancel={exit}
          onSubmit={async form => {
            dispatch.ui.set({ setupServiceBusy: form.id })
            if (device?.permissions.includes('MANAGE')) {
              service.attributes = { ...service.attributes, ...form.attributes }
              await dispatch.devices.setServiceAttributes(service)
              if (device.configurable) {
                await dispatch.devices.cloudUpdateService({ form, deviceId: device.id })
              } else {
                await dispatch.devices.rename({ id: service.id, name: form.name })
                await dispatch.devices.fetchDevices({ ids: [device.id] })
              }
            }
            dispatch.ui.set({ setupServiceBusy: undefined })
          }}
        />
      </Gutters>
    </>
  )
}
