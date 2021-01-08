import { LEGACY_ATTRIBUTES } from '../../shared/constants'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Typography } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { ApplicationState } from '../../store'
import { TargetPlatform } from '../../components/TargetPlatform'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { DataDisplay } from '../../components/DataDisplay'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { QualityDetails } from '../../components/QualityDetails'
import { getDevices } from '../../models/accounts'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

export const DeviceDetailPage = () => {
  const { deviceID } = useParams<{ deviceID: string }>()
  const devices = useSelector((state: ApplicationState) => getDevices(state))
  const device = devices.find((d: IDevice) => d.id === deviceID && !d.hidden)

  useEffect(() => {
    analyticsHelper.page('DevicesDetailPage')
  }, [])

  if (!device) return null

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="info-circle" color="grayDarker" size="lg" />
            <Title inline>Details</Title>
          </Typography>
        </>
      }
    >
      <Columns count={1} inset>
        <DataDisplay
          data={[
            { label: 'Device Name', value: device.name },
            { label: 'Platform', value: TargetPlatform({ id: device.targetPlatform, label: true }), format: 'element' },
            {
              label: 'Internet Connectivity',
              format: 'element',
              value: <QualityDetails device={device} />,
            },
            { label: 'Owner', value: device.owner.email },
            { label: 'Last reported', value: device.lastReported, format: 'duration' },
            { label: 'ISP', value: device.geo?.isp },
            { label: 'Connection type', value: device.geo?.connectionType },
            { label: 'Location', value: device.geo, format: 'location' },
            { label: 'External IP address', value: device.externalAddress },
            { label: 'Internal IP address', value: device.internalAddress },
            { label: 'Device ID', value: device.id },
            { label: 'Hardware ID', value: device.hardwareID },
            ...LEGACY_ATTRIBUTES.map(label => ({ label, value: device.attributes[label] })),
          ]}
        />
      </Columns>
    </Container>
  )
}
