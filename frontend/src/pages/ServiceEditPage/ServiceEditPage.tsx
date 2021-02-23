import React, { useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { selectById } from '../../models/devices'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { Typography } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { ServiceHeaderMenu } from '../../components/ServiceHeaderMenu'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ServiceForm } from '../../components/ServiceForm'
import { getLinks } from '../../helpers/routeHelper'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
  device?: IDevice
}
export const ServiceEditPage: React.FC<Props> = ({ targets, targetDevice, device }) => {
  const { devices, backend, applicationTypes } = useDispatch<Dispatch>()
  const { serviceID = '', deviceID } = useParams<{ serviceID: string; deviceID: string }>()
  const { service, links } = useSelector((state: ApplicationState) => ({
    service: device?.services.find(s => s.id === serviceID),
    links: getLinks(state, deviceID),
  }))
  const target = targets?.find(t => t.uid === serviceID)
  const thisDevice = service?.deviceID === targetDevice.uid
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    applicationTypes.fetch()
    analyticsHelper.page('ServiceEditPage')
  }, [])

  if (!service || (thisDevice && !target)) {
    history.push(links.edit)
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
            await devices.cloudUpdateService({ form, deviceId: deviceID })
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
