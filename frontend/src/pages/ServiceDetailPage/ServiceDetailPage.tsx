import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Typography, Divider } from '@material-ui/core'
import { useHistory, useParams, useLocation } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { ApplicationState } from '../../store'
import { Container } from '../../components/Container'
import { Body } from '../../components/Body'
import { Columns } from '../../components/Columns'
import { DataDisplay } from '../../components/DataDisplay'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { spacing, colors, fontSizes } from '../../styling'
import { Icon } from '../../components/Icon'

export const ServiceDetailPage = () => {
  const css = useStyles()

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
    analytics.page('ServiceDetailPage')
  }, [])

  if(device) {
    return (
      <Container
        header={
        <>
          <OutOfBand />
          <Breadcrumbs />
          <div className={css.header}>
            <Icon className={css.iconStyle} name={'info-circle'} size="md" fixedWidth />
            <Typography className={css.title} variant="h2">Service details</Typography>
          </div>
        </>
      }
      >
        <Body>
          <Typography variant="subtitle1">Service details</Typography>
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


const useStyles = makeStyles({
  iconStyle: {
    padding:12,
  },
  title: {
    paddingLeft:22,
    paddingTop: 12,
    paddingBottom: 12
  },
  header: {
    display:'flex',
    flexDirection: 'row',
    paddingLeft: 30,
    paddingBottom: 10
  },
})
