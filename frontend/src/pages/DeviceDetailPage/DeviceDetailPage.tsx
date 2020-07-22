import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Typography } from '@material-ui/core'
import { useHistory, useParams, useLocation } from 'react-router-dom'
import { ApplicationState } from '../../store'
import { Container } from '../../components/Container'
import { Body } from '../../components/Body'
import { Columns } from '../../components/Columns'
import { DataDisplay } from '../../components/DataDisplay'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'

export const DeviceDetailPage = () => {
  const { connections, devices, searched, query } = useSelector((state: ApplicationState) => ({
    connections: state.backend.connections,
    devices: state.devices.all,
    searched: state.devices.searched,
    query: state.devices.query,
  }))
  const { deviceID } = useParams()
  const history = useHistory()
  const device = devices.find((d: IDevice) => d.id === deviceID && !d.hidden)

  useEffect(() => {
    analytics.page('DevicesPage')
  }, [])

  if(device) {
    return (
      <Container
      header={
        <>
          <OutOfBand />
          <Breadcrumbs />
          {/* <Typography variant="h1">
            <Icon name="hdd" size="lg" type="light" color="grayDarker" fixedWidth />
            <span className={css.title}>{device.name}</span>
            {setupDeletingDevice ? (
              <CircularProgress className={css.loading} size={styles.fontSizes.md} />
            ) : (
              <Tooltip title="Delete">
                <IconButton onClick={() => window.confirm(confirmMessage) && onDelete()} disabled={setupBusy}>
                  <Icon name="trash-alt" size="md" />
                </IconButton>
              </Tooltip>
            )}
          </Typography> */}
        </>
      }
      >
        <Body>
          <Typography variant="subtitle1">Device details</Typography>
          <Columns count={1} inset>
            <DataDisplay
              data={[
                {
                  label: 'Availability',
                  value: device.availability,
                  format: 'percent',
                  help: 'Average time online per day',
                },
                { label: 'Instability', value: device.instability, format: 'round', help: 'Average disconnects per day' },
                { label: 'Owner', value: device.owner },
                { label: 'Last reported', value: device.lastReported, format: 'duration' },
                { label: 'ISP', value: device.geo?.isp },
                { label: 'Connection type', value: device.geo?.connectionType },
                { label: 'Location', value: device.geo, format: 'location' },
                { label: 'External IP address', value: device.externalAddress },
                { label: 'Internal IP address', value: device.internalAddress },
                { label: 'Device ID', value: device.id },
                { label: 'Hardware ID', value: device.hardwareID },
              ]}
            />
          </Columns>
        </Body>
      </Container>
    )
  } else {
    return (
      <Container
        header={<>
        </>}
      >
      </Container>

    )
  }
}