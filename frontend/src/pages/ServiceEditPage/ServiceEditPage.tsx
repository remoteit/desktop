import React, { useEffect } from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { ServiceHeaderMenu } from '../../components/ServiceHeaderMenu'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { ServiceForm } from '../../components/ServiceForm'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = { device?: IDevice }

export const ServiceEditPage: React.FC<Props> = ({ device }) => {
  const { thisId } = useSelector((state: ApplicationState) => state.backend)
  const { devices, applicationTypes } = useDispatch<Dispatch>()
  const { serviceID } = useParams<{ serviceID?: string }>()
  const service = device?.services.find(s => s.id === serviceID)
  const thisDevice = service?.deviceID === thisId
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    applicationTypes.fetch()
    analyticsHelper.page('ServiceEditPage')
  }, [])

  if (!service) {
    history.push(`/devices/${device?.id}`)
    return null
  }

  const exit = () => history.push(location.pathname.replace(REGEX_LAST_PATH, ''))

  return (
    <ServiceHeaderMenu device={device} service={service}>
      <ServiceForm
        service={service}
        thisDevice={thisDevice}
        editable={thisDevice || !!device?.configurable}
        onCancel={exit}
        onSubmit={async form => {
          if (device?.configurable) await devices.cloudUpdateService({ form, deviceId: device?.id })
          history.push(`/devices/${device?.id}/${service.id}`)
        }}
      />
    </ServiceHeaderMenu>
  )
}
