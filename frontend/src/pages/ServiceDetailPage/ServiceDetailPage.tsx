import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { IconButton, makeStyles } from '@material-ui/core'
import { ServiceHeaderMenu } from '../../components/ServiceHeaderMenu'
import { ApplicationState } from '../../store'
import { DataDisplay } from '../../components/DataDisplay'
import { ComboButton } from '../../buttons/ComboButton'
import { Columns } from '../../components/Columns'
import { Gutters } from '../../components/Gutters'
import { spacing } from '../../styling'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

export const ServiceDetailPage: React.FC<{ device?: IDevice; targets: ITarget[] }> = ({ device, targets }) => {
  const { serviceID } = useParams<{ serviceID: string }>()
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const service = device?.services.find(s => s.id === serviceID)
  const target = targets.find(t => t.uid === serviceID)
  const css = useStyles()

  useEffect(() => {
    analyticsHelper.page('ServiceDetailPage')
  }, [])

  if (!service || !device) return null

  let data: IDataDisplay[] = []

  if (connection && connection.connected) {
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
    { label: 'Remote Protocol', value: service.protocol },
    { label: 'Service Type', value: service.type },
    { label: 'Device Name', value: device.name },
    { label: 'Owner', value: device.owner.email },
    { label: 'Service ID', value: service.id },
  ])

  return (
    <ServiceHeaderMenu
      device={device}
      service={service}
      target={target}
      footer={
        <Gutters className={css.gutters}>
          <ComboButton connection={connection} service={service} size="medium" fullWidth />
          {/* <Icon name="neuter" /> */}
          <Link to={`/connections/new/${service.id}`}>
            <IconButton>
              <Icon name="cog" />
            </IconButton>
          </Link>
        </Gutters>
      }
    >
      <Columns count={1} inset>
        <DataDisplay data={data} />
      </Columns>
    </ServiceHeaderMenu>
  )
}

const useStyles = makeStyles({
  gutters: {
    display: 'flex',
    margin: spacing.lg,
  },
})
