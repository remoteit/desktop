import React, { useEffect } from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { ServiceHeaderMenu } from '../../components/ServiceHeaderMenu'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { ServiceForm } from '../../components/ServiceForm'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
  device?: IDevice
}
export const ServiceEditPage: React.FC<Props> = ({ targets, targetDevice, device }) => {
  const { devices, backend, applicationTypes } = useDispatch<Dispatch>()
  const { serviceID } = useParams<{ serviceID?: string }>()
  const service = device?.services.find(s => s.id === serviceID)
  const target = targets?.find(t => t.uid === serviceID)
  const thisDevice = service?.deviceID === targetDevice.uid
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    applicationTypes.fetch()
    analyticsHelper.page('ServiceEditPage')
  }, [])

  if (!service || (thisDevice && !target)) {
    history.push(`/devices/${device?.id}`)
    return null
  }

  const exit = () => history.push(location.pathname.replace(REGEX_LAST_PATH, ''))

  return (
    <ServiceHeaderMenu device={device} service={service} target={target}>
      <ServiceForm
        service={service}
        target={target}
        thisDevice={thisDevice}
        editable={thisDevice || !!device?.configurable}
        onCancel={exit}
        onSubmit={async form => {
          if (device?.configurable) {
            // CloudShift
            await devices.cloudUpdateService({ form, deviceId: device?.id })
          } else {
            // for local cli config update
            backend.updateTargetService(form)
            // for rest api name change
            service.name = form.name || ''
            devices.rename(service)
            // for cloud route attribute change
            service.attributes = { ...service.attributes, ...form.attributes }
            devices.setServiceAttributes(service)
          }
          exit()
        }}
      />
    </ServiceHeaderMenu>
  )
}
