import React, { useEffect } from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { REGEX_LAST_PATH } from '../../shared/constants'
import { Typography } from '@material-ui/core'
import { Container } from '../../components/Container'
import { ServiceForm } from '../../components/ServiceForm'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Title } from '../../components/Title'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
}

export const ServiceAddPage: React.FC<Props> = ({ targets }) => {
  const { setupServicesLimit, setupAdded } = useSelector((state: ApplicationState) => state.ui)
  const { backend, ui, applicationTypes } = useDispatch<Dispatch>()
  const { deviceID } = useParams()
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
            <Title>Add service</Title>
          </Typography>
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
          thisDevice={true}
          name={setupAdded?.name}
          target={setupAdded}
          onSubmit={form => {
            ui.set({ setupAdded: undefined })
            backend.addTargetService(form)
            history.push(`/devices/${deviceID}/edit`)
          }}
          onCancel={() => history.push(location.pathname.replace(REGEX_LAST_PATH, ''))}
        />
      )}
    </Container>
  )
}
