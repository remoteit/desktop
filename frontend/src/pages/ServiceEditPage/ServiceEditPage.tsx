import React, { useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { findService } from '../../models/devices'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { UnregisterServiceButton } from '../../buttons/UnregisterServiceButton'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { Typography } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ServiceForm } from '../../components/ServiceForm'
import { getDevices } from '../../models/accounts'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
}
export const ServiceEditPage: React.FC<Props> = ({ targets, targetDevice }) => {
  const { devices, backend, applicationTypes } = useDispatch<Dispatch>()
  const { serviceID = '', deviceID } = useParams<{ serviceID: string; deviceID: string }>()
  const [service] = useSelector((state: ApplicationState) => findService(getDevices(state), serviceID))
  const target = targets?.find(t => t.uid === serviceID)
  const thisDevice = service?.deviceID === targetDevice.uid
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    applicationTypes.fetch()
    analyticsHelper.page('ServiceEditPage')
  }, [])

  if (!service || (thisDevice && !target)) {
    history.push(`/devices/${deviceID}/edit`)
    return null
  }

  const exit = () => history.push(location.pathname.replace(REGEX_LAST_PATH, ''))

  return (
    <Container
      header={
        <>
          <OutOfBand />
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="pen" size="lg" type="light" color="grayDarker" fixedWidth />
            <Title>Edit service</Title>
            <UnregisterServiceButton target={target} />
          </Typography>
        </>
      }
    >
      <ServiceForm
        target={target}
        name={service.name}
        route={service.attributes.route}
        thisDevice={thisDevice}
        onCancel={exit}
        onSubmit={form => {
          // for local cli config update
          backend.updateTargetService(form)
          // for cloud route attribute change
          service.attributes.route = form.route
          devices.setServiceAttributes(service)
          // for rest api name change
          service.name = form.name
          devices.rename(service)
          exit()
        }}
      />
    </Container>
  )
}
