import React from 'react'
import { Typography } from '@mui/material'
import { useLocation, Redirect } from 'react-router-dom'
import { DeviceContext } from '../services/Context'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { NoConnectionPage } from './NoConnectionPage'
import { ConnectionName } from '../components/ConnectionName'
import { InfoButton } from '../buttons/InfoButton'
import { Container } from '../components/Container'
import { Diagram } from '../components/Diagram'
import { Connect } from '../components/Connect'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'

export const ConnectionPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const { connection, device, service, network, instance } = React.useContext(DeviceContext)
  const { defaultSelection } = useSelector((state: ApplicationState) => state.ui)
  const menu = location.pathname.match(REGEX_FIRST_PATH)?.[0] || ''

  React.useEffect(() => {
    if (service) dispatch.ui.set({ defaultSelection: { ...defaultSelection, [menu]: location.pathname } })
  }, [service])

  if (!service) {
    if (defaultSelection[menu]) return <Redirect to={defaultSelection[menu]} push={false} />
    return <NoConnectionPage />
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
      backgroundColor={connection.enabled ? 'primaryBackground' : 'grayLighter'}
      header={
        <>
          <Typography variant="h1" gutterBottom={!service?.attributes.description}>
            <Title>
              <ConnectionName name={connection.name} />
            </Title>
            {!network && device && <InfoButton device={device} service={service} />}
          </Typography>
          {service?.attributes.description && (
            <Gutters bottom="xl" top={null}>
              <Typography variant="body2" color="textSecondary">
                {service?.attributes.description}
              </Typography>
            </Gutters>
          )}
          <Gutters size="md" bottom="sm">
            <Diagram
              to={{
                initiator: `${menu}/${service.id}`,
                target: `/devices/${device?.id}/${service.id}/edit`,
              }}
            />
          </Gutters>
        </>
      }
    >
      <Connect />
    </Container>
  )
}
