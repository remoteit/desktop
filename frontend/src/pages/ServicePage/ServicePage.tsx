import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Typography, Divider, List, ListItemIcon, ListItemText } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { Icon } from '../../components/Icon'
import { PortSetting } from '../../components/PortSetting'
import { HostSetting } from '../../components/HostSetting'
import { NameSetting } from '../../components/NameSetting'
import { findService } from '../../models/devices'
import { ServiceName } from '../../components/ServiceName'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ProxySetting } from '../../components/ProxySetting'
import { UsernameSetting } from '../../components/UsernameSetting'
import { AutoStartSetting } from '../../components/AutoStartSetting'
import { ServiceConnected } from '../../components/ServiceConnected'
import { ApplicationState } from '../../store'
import { ConnectionErrorMessage } from '../../components/ConnectionErrorMessage'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { LanShareSelect } from '../../components/LanShareSelect'
import { LaunchSetting } from '../../components/LaunchSetting'
import { ConnectButton } from '../../buttons/ConnectButton'
import { LaunchButton } from '../../buttons/LaunchButton'
import { ForgetButton } from '../../buttons/ForgetButton'
import { UsersSelect } from '../../components/UsersSelect'
import { ErrorButton } from '../../buttons/ErrorButton'
import { DataDisplay } from '../../components/DataDisplay'
import { CopyButton } from '../../buttons/CopyButton'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { spacing } from '../../styling'
import analytics from '../../helpers/Analytics'
import { ListItemLocation } from '../../components/ListItemLocation'

export const ServicePage: React.FC = () => {
  const css = useStyles()
  const { serviceID = '' } = useParams()
  const [showError, setShowError] = useState<boolean>(false)
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))

  let data: IDataDisplay[] = []

  useEffect(() => {
    analytics.page('ServicePage')
  }, [])

  if (!service || !device)
    return (
      <>
        <Typography variant="h1">
          <ConnectionStateIcon connection={connection} size="lg" />
          <ServiceName connection={connection} inline />
          <ForgetButton connection={connection} />
        </Typography>
        <section>
          {connection && (
            <Typography variant="caption">Device may have been removed ({connection.deviceID})</Typography>
          )}
        </section>
      </>
    )

  if (connection && connection.active) {
    data = data.concat([
      { label: 'Host', value: connection.host },
      { label: 'Port', value: connection.port },
      { label: 'Restriction', value: connection.restriction },
    ])
  }

  data = data.concat([
    { label: 'Last reported', value: service.lastReported, format: 'duration' },
    { label: 'Service Name', value: service.name },
    { label: 'Remote Port', value: service.port },
    { label: 'Service Type', value: service.type },
    { label: 'Device Name', value: device.name },
    { label: 'Owner', value: device.owner },
    { label: 'Service ID', value: service.id },
  ])

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <ConnectionStateIcon connection={connection} service={service} size="lg" />
            <ServiceName connection={connection} service={service} inline />
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <ForgetButton connection={connection} />
            <LaunchButton connection={connection} service={service} />
            <CopyButton connection={connection} service={service} />
          </Typography>
          <List className={css.errorMessage}>
            <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
          </List>
        </>
      }
    >
      <ServiceConnected connection={connection} service={service} />
      <Columns center>
        <List>
          <PortSetting connection={connection} service={service} />
          <HostSetting connection={connection} service={service} />
          <NameSetting connection={connection} service={service} />
          <UsernameSetting connection={connection} service={service} />
          <LaunchSetting connection={connection} service={service} />
          <div>
            ADVANCE SETTINGS
          </div>
        </List>
        <div className={css.actions}>
          <ConnectButton connection={connection} service={service} size="medium" />
        </div>
      </Columns>
      <Divider />
      {/* <List>
        <UsersSelect service={service} />
        <LanShareSelect connection={connection} service={service} />
        <ProxySetting connection={connection} service={service} />
        <AutoStartSetting connection={connection} service={service} />
      </List> */}
      <Divider />
      <section>
        <DeviceActionsList deviceUID={device.id} />
      </section>


      {/* <Columns inset>
        <DataDisplay data={data} />
      </Columns> */}
    </Container>
  )
}

const useStyles = makeStyles({
  actions: {
    marginRight: spacing.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMessage: { padding: 0 },
})

type ActionType = {
  title: string,
  icon: string,
  pathname: string
}

const DeviceActionsList:React.FC<{deviceUID: string}> = ({deviceUID}) => {
  const actions: ActionType[] = [
    {title: 'Shared Users', icon:'user-friends', pathname:'/devices/setup'},
    {title: 'Edit Service', icon: 'pen', pathname:'/devices/setup'},
    {title: 'Service Details', icon:'info-circle', pathname:`/deviceDetail/${deviceUID}`}
  ];

  return (
    <List>
        {actions.map(
          action => {
            return (
              <DeviceActionListItem 
                title={action.title} 
                icon={action.icon} 
                pathname={action.pathname}
              />
            )
          }
        )}
    </List>

  )
}

const DeviceActionListItem: React.FC<ActionType> = (action) => {
  return (
    <ListItemLocation pathname={action.pathname }>
      <ListItemIcon>
        <Icon name={action.icon} size="md" fixedWidth />
      </ListItemIcon>
      <ListItemText primary={action.title} />
    </ListItemLocation>
  )
}
