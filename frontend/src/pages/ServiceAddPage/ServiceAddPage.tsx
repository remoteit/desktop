import React, { useEffect } from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { LicensingServiceNotice } from '../../components/LicensingServiceNotice'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { getAllDevices } from '../../models/accounts'
import { Typography } from '@material-ui/core'
import { Container } from '../../components/Container'
import { ServiceForm } from '../../components/ServiceForm'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { getLinks } from '../../helpers/routeHelper'
import { Title } from '../../components/Title'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
}

export const ServiceAddPage: React.FC<Props> = ({ targets, targetDevice }) => {
  const { deviceID } = useParams<{ deviceID: string }>()
  const { backend, applicationTypes, devices } = useDispatch<Dispatch>()
  const { setupServicesLimit, device, links } = useSelector((state: ApplicationState) => ({
    ...state.ui,
    device: getAllDevices(state).find(d => d.id === deviceID),
    links: getLinks(state, deviceID),
  }))
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    applicationTypes.fetch()
    analyticsHelper.page('ServiceAddPage')
  }, [])

  const maxReached = targets.length + 1 > setupServicesLimit

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="pen" size="lg" type="light" color="grayDarker" fixedWidth />
            <Title inline>Add service</Title>
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
          thisDevice={device?.id === targetDevice.uid}
          editable={device?.configurable || device?.id === targetDevice.uid}
          onSubmit={async form => {
            if (device?.configurable) {
              // CloudShift
              devices.cloudAddService({ form, deviceId: device?.id })
            } else {
              await backend.addTargetService(form)
              await backend.set({ deferredAttributes: form.attributes }) // set route attributes via deferred update
            }
            history.push(links.edit)
          }}
          onCancel={() => history.push(location.pathname.replace(REGEX_LAST_PATH, ''))}
        />
      )}
    </Container>
  )
}
