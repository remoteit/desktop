import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { findService } from '../../models/devices'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Divider, List } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { UnregisterServiceButton } from '../../buttons/UnregisterServiceButton'
import { ServiceForm } from '../../components/ServiceForm'
import { attributeName } from '../../shared/nameHelper'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
}
export const ServiceEditPage: React.FC<Props> = ({ targets, targetDevice }) => {
  const { devices, backend } = useDispatch<Dispatch>()
  const { serviceID = '', deviceID } = useParams()
  const [service] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const target = targets?.find(t => t.uid === serviceID)
  const thisDeviceTarget = service?.deviceID === targetDevice.uid
  const history = useHistory()

  useEffect(() => {
    analyticsHelper.page('ServiceEditPage')
  }, [])

  //@FIXME move this type of routing to the router
  if (!service || (thisDeviceTarget && !target)) {
    history.push(`/devices/${deviceID}/edit`)
    return null
  }

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
        onSubmit={form => {
          // for local cli config update
          backend.updateTargetService(form)
          // for cloud name change
          service.attributes.name = form.name
          devices.setServiceAttributes(service)
          history.push(`/devices/${deviceID}/edit`)
        }}
      />
    </Container>
  )
}
