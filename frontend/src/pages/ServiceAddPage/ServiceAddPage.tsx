import React, { useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { LicensingServiceNotice } from '../../components/LicensingServiceNotice'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { Typography } from '@material-ui/core'
import { Container } from '../../components/Container'
import { ServiceForm } from '../../components/ServiceForm'
import { Title } from '../../components/Title'
import { Body } from '../../components/Body'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targetDevice: ITargetDevice
  device?: IDevice
}

export const ServiceAddPage: React.FC<Props> = ({ targetDevice, device }) => {
  const { backend, applicationTypes, devices } = useDispatch<Dispatch>()
  const { setupServicesLimit } = useSelector((state: ApplicationState) => state.ui)
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    applicationTypes.fetch()
    analyticsHelper.page('ServiceAddPage')
  }, [])

  const maxReached = device && device.services.length >= setupServicesLimit

  return (
    <Container
      header={
        <>
          <Typography variant="h1">
            <Title>Add service</Title>
          </Typography>
          <LicensingServiceNotice device={device} />
        </>
      }
    >
      {maxReached ? (
        <Body center>
          <Typography variant="body2" color="textSecondary">
            Desktop currently supports a maximum of {setupServicesLimit} services.
          </Typography>
        </Body>
      ) : (
        <ServiceForm
          thisDevice={!!device?.thisDevice}
          editable={device?.configurable || !!device?.thisDevice}
          onSubmit={async form => {
            if (device?.configurable) {
              // CloudShift
              devices.cloudAddService({ form, deviceId: device?.id })
            } else {
              await backend.addTargetService(form)
              await backend.set({ deferredAttributes: form.attributes }) // set route attributes via deferred update
            }
            history.push(`/devices/${device?.id}`)
          }}
          onCancel={() => history.push(location.pathname.replace(REGEX_LAST_PATH, ''))}
        />
      )}
    </Container>
  )
}
