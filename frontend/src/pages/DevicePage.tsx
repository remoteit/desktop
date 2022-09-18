import React, { useContext } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { DeviceContext } from '../services/Context'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { getDeviceModel } from '../models/accounts'
import { AddFromNetwork } from '../components/AddFromNetwork'
import { ApplicationState } from '../store'
import { AddServiceButton } from '../buttons/AddServiceButton'
import { ListItemLocation } from '../components/ListItemLocation'
import { ServiceMiniState } from '../components/ServiceMiniState'
import { Typography, Box, List, ListItemText, ListItemSecondaryAction, CircularProgress } from '@mui/material'
import { getSortOptions, SortServices } from '../components/SortServices'
import { ConnectionStateIcon } from '../components/ConnectionStateIcon'
import { ServiceContextualMenu } from '../components/ServiceContextualMenu'
import { LicensingNotice } from '../components/LicensingNotice'
import { ConnectButton } from '../buttons/ConnectButton'
import { ServiceName } from '../components/ServiceName'
import { Container } from '../components/Container'
import { GuideStep } from '../components/GuideStep'
import { Notice } from '../components/Notice'
import { TestUI } from '../components/TestUI'
import { Title } from '../components/Title'
import { fontSizes } from '../styling'

type Props = {
  device?: IDevice
}

export const DevicePage: React.FC<Props> = () => {
  const { connections, device } = useContext(DeviceContext)
  const location = useLocation()
  const history = useHistory()
  const css = useStyles()
  const { setupAddingService, sortService } = useSelector((state: ApplicationState) => ({
    setupAddingService: state.ui.setupAddingService,
    sortService: getDeviceModel(state).sortServiceOption,
  }))

  if (!device)
    return (
      <span>
        <Notice severity="warning">Device not found.</Notice>
      </span>
    )

  const editable = device.thisDevice || (device.configurable && device.permissions.includes('MANAGE'))
  const connection = connections?.find(c => c.deviceID === device.id && c.enabled)

  // reverse sort services by creation date
  device.services.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  let servicePage = '/' + (location.pathname.split('/')[4] || 'connect')
  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <List>
          <ListItemLocation
            pathname={`/devices/${device.id}/details`}
            match={[
              `/devices/${device.id}/details`,
              `/devices/${device.id}/edit`,
              `/devices/${device.id}/users`,
              `/devices/${device.id}/logs`,
              `/devices/${device.id}`,
            ]}
            icon={<ConnectionStateIcon device={device} connection={connection} size="xl" />}
            exactMatch
            dense
            title={
              <Typography variant="h3">
                <ServiceName device={device} connection={connection} />
              </Typography>
            }
            subtitle={device.thisDevice ? 'This device' : undefined}
          />
        </List>
      }
    >
      {device.state === 'inactive' && (
        <Notice severity="info" gutterTop>
          Device offline
        </Notice>
      )}
      {device.license === 'UNLICENSED' && (
        <Notice severity="warning" gutterTop>
          Device unlicensed
        </Notice>
      )}
      <Typography variant="subtitle1">
        <Title>Service</Title>
        <SortServices />
        <AddFromNetwork allowScanning={device.thisDevice} button />
        <AddServiceButton device={device} editable={editable} link={`/devices/${device.id}/add`} />
      </Typography>
      <List>
        {editable && <LicensingNotice device={device} />}
        {editable && setupAddingService && (
          <ListItemLocation pathname="" disableIcon disabled dense>
            <ListItemText primary="Registering..." />
            <ListItemSecondaryAction>
              <CircularProgress color="primary" size={fontSizes.md} />
            </ListItemSecondaryAction>
          </ListItemLocation>
        )}
        {device.services.sort(getSortOptions(sortService).sortService).map(s => {
          const c = connections?.find(c => c.id === s.id)
          return (
            <GuideStep
              key={s.id}
              guide="aws"
              step={4}
              instructions="Select the service below."
              hide={!s.name.includes('Start')}
              highlight
              autoNext
            >
              <ListItemLocation
                pathname={`/devices/${device.id}/${s.id}${servicePage}`}
                match={`/devices/${device.id}/${s.id}`}
                disableIcon
                dense
              >
                <ListItemText primary={<ServiceName service={s} connection={c} />} />
                <ListItemSecondaryAction>
                  <ServiceMiniState /* className="hoverHide" */ service={s} connection={c} />
                  {/* <TestUI>
                    <Box className={css.connect}>
                      <ConnectButton
                        color="primary"
                        size="icon"
                        className="hidden"
                        iconSize="base"
                        iconType="solid"
                        connection={c}
                        permissions={device.permissions}
                        service={s}
                        disabled={s.state === 'inactive' || device.thisDevice}
                        onClick={() => history.push(`/devices/${device.id}/${s.id}`)}
                      />
                    </Box>
                  </TestUI> */}
                </ListItemSecondaryAction>
              </ListItemLocation>
            </GuideStep>
          )
        })}
      </List>
      <ServiceContextualMenu />
    </Container>
  )
}

const useStyles = makeStyles({
  connect: {
    right: 0,
    top: 0,
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    height: '100%',
  },
})
