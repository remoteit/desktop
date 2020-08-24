import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { findService } from '../../models/devices'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Divider, List, ListItemIcon, ListItemText, ListItemSecondaryAction, Chip } from '@material-ui/core'
import { findType } from '../../services/serviceTypes'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { DeviceNameSetting } from '../../components/DeviceNameSetting'
import { ListItemLocation } from '../../components/ListItemLocation'
import { SharedAccessSetting } from '../../components/SharedAccessSetting'
import { InlineTextFieldSetting } from '../../components/InlineTextFieldSetting'
import { ServiceSetting } from '../../components/ServiceSetting'
import { UnregisterButton } from '../../buttons/UnregisterButton'
import { attributeName } from '../../shared/nameHelper'
import { DeleteButton } from '../../buttons/DeleteButton'
import { Targets } from '../../components/Targets/Targets'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
}
export const ServiceEditPage: React.FC<Props> = ({ targets }) => {
  const css = useStyles()
  const history = useHistory()
  const { devices } = useDispatch<Dispatch>()
  const { serviceID = '', deviceID } = useParams()
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const thisDevice = useSelector((state: ApplicationState) => state.backend.device?.uid) === device?.id

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

const useStyles = makeStyles({})
