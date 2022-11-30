import React, { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { LicensingServiceNotice } from '../../components/LicensingServiceNotice'
import { ServiceSmartForm } from '../../components/ServiceSmartForm'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { ServiceForm } from '../../components/ServiceForm'
import { isForward } from '../../helpers/connectionHelper'
import { Typography } from '@mui/material'
import { Container } from '../../components/Container'
import { Diagram } from '../../components/Diagram'
import { Gutters } from '../../components/Gutters'
import { Title } from '../../components/Title'

type Props = { device?: IDevice; form?: boolean }

export const ServiceAddPage: React.FC<Props> = ({ device, form }) => {
  const { applicationTypes, devices } = useDispatch<Dispatch>()
  const { setupServicesLimit } = useSelector((state: ApplicationState) => state.ui)
  const [forward, setForward] = useState<boolean>(false)
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    applicationTypes.fetch()
  }, [])

  const maxReached = device && device.services.length >= setupServicesLimit
  const Form = form ? ServiceForm : ServiceSmartForm

  return (
    <Container
      gutterBottom
      bodyProps={{ center: !form }}
      integrated
      header={
        <>
          <Typography variant="h1">
            <Title>New service</Title>
          </Typography>
          <Gutters>
            <Diagram highlightTypes={['target', 'relay']} forward={forward} />
          </Gutters>
          <LicensingServiceNotice device={device} />
        </>
      }
    >
      {maxReached ? (
        <Typography variant="body2" color="textSecondary">
          Desktop currently supports a maximum of {setupServicesLimit} services.
        </Typography>
      ) : (
        <Form
          adding
          thisDevice={!!device?.thisDevice}
          editable={device?.configurable || !!device?.thisDevice}
          disabled={!device?.permissions.includes('MANAGE')}
          onSubmit={async form => {
            if (device?.configurable) await devices.cloudAddService({ form, deviceId: device?.id })
            history.push(`/devices/${device?.id}`)
          }}
          onChange={form => setForward(isForward(form))}
          onCancel={() => history.push(location.pathname.replace(REGEX_LAST_PATH, ''))}
        />
      )}
    </Container>
  )
}
