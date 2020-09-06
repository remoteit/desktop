import React, { useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
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
  const { setupServicesLimit } = useSelector((state: ApplicationState) => state.ui)
  const { backend } = useDispatch<Dispatch>()
  const { deviceID } = useParams()
  const history = useHistory()

  useEffect(() => {
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
          onSubmit={form => {
            backend.addTargetService(form)
            history.push(`/devices/${deviceID}/edit`)
          }}
        />
      )}
    </Container>
  )
}
