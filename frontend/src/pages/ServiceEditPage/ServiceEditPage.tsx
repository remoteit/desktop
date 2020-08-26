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
import { InlineTextFieldSetting } from '../../components/InlineTextFieldSetting'
import { ServiceSetting } from '../../components/ServiceSetting'
import { attributeName } from '../../shared/nameHelper'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
}
export const ServiceEditPage: React.FC<Props> = ({ targets }) => {
  const history = useHistory()
  const { devices } = useDispatch<Dispatch>()
  const { serviceID = '', deviceID } = useParams()
  const [service] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))

  useEffect(() => {
    analyticsHelper.page('ServiceEditPage')
  }, [])

  //@FIXME move this type of routing to the router

  if (!service) {
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
            {/* {thisDevice ? <UnregisterButton targetDevice={} /> : <DeleteButton device={device} />} */}
          </Typography>
        </>
      }
    >
      <List>
        <InlineTextFieldSetting
          value={attributeName(service)}
          label="Service Name"
          resetValue={service.name}
          onSave={name => {
            service.attributes.name = name.toString()
            devices.setServiceAttributes(service)
          }}
        />
      </List>
      <Divider />
      <List>
        <ServiceSetting service={service} targets={targets} />
      </List>
    </Container>
  )
}
