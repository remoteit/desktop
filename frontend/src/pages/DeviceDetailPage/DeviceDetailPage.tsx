import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Typography } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { ApplicationState } from '../../store'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { DataDisplay } from '../../components/DataDisplay'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { spacing, colors, fontSizes } from '../../styling'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'

export const DeviceDetailPage = () => {
  const css = useStyles()
  const { deviceID } = useParams()
  const devices = useSelector((state: ApplicationState) => state.devices.all)
  const device = devices.find((d: IDevice) => d.id === deviceID && !d.hidden)

  useEffect(() => {
    analytics.page('DevicesDetailPage')
  }, [])

  if (!device) return null

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="info-circle" color="grayDarker" size="lg" />
            <Title>Details</Title>
          </Typography>
        </>
      }
    >
      <Columns count={1} inset>
        <DataDisplay
          data={[
            {
              label: 'Availability',
              value: device.availability,
              format: 'percent',
              help: 'Average time online per day',
            },
            {
              label: 'Instability',
              value: device.instability,
              format: 'round',
              help: 'Average disconnects per day',
            },
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
    </Container>
  )
}

const useStyles = makeStyles({})
