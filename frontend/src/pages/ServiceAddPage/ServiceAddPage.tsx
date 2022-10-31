import React, { useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { LicensingServiceNotice } from '../../components/LicensingServiceNotice'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { Typography } from '@mui/material'
import { Container } from '../../components/Container'
import { ServiceForm } from '../../components/ServiceForm'
import { Title } from '../../components/Title'
import { Body } from '../../components/Body'

type Props = { device?: IDevice }

export const ServiceAddPage: React.FC<Props> = ({ device }) => {
  const { applicationTypes, devices } = useDispatch<Dispatch>()
  const { setupServicesLimit } = useSelector((state: ApplicationState) => state.ui)
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    applicationTypes.fetch()
  }, [])

  const maxReached = device && device.services.length >= setupServicesLimit

  return (
    <Container
      gutterBottom
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
          adding
          thisDevice={!!device?.thisDevice}
          editable={device?.configurable || !!device?.thisDevice}
          disabled={!device?.permissions.includes('MANAGE')}
          onSubmit={async form => {
            if (device?.configurable) devices.cloudAddService({ form, deviceId: device?.id })
            history.push(`/devices/${device?.id}`)
          }}
          onCancel={() => history.push(location.pathname.replace(REGEX_LAST_PATH, ''))}
        />
      )}
    </Container>
  )
} // }
