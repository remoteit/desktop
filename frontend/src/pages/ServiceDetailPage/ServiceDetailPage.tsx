import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { IconButton, makeStyles, Tooltip } from '@material-ui/core'
import { ServiceHeaderMenu } from '../../components/ServiceHeaderMenu'
import { ConnectionDetails } from '../../components/ConnectionDetails'
import { ApplicationState } from '../../store'
import { connectionState } from '../../helpers/connectionHelper'
import { LaunchButton } from '../../buttons/LaunchButton'
import { DataDisplay } from '../../components/DataDisplay'
import { ComboButton } from '../../buttons/ComboButton'
import { CopyButton } from '../../buttons/CopyButton'
import { isRemoteUI } from '../../helpers/uiHelper'
import { getAttributes } from '../../helpers/attributes'
import { Gutters } from '../../components/Gutters'
import { Notice } from '../../components/Notice'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

export const ServiceDetailPage: React.FC<{ device?: IDevice; targets: ITarget[] }> = ({ device, targets }) => {
  const { serviceID } = useParams<{ serviceID: string }>()
  const service = device?.services.find(s => s.id === serviceID)
  const { connection, remoteUI } = useSelector((state: ApplicationState) => ({
    connection: state.connections.all.find(c => c.id === serviceID),
    remoteUI: isRemoteUI(state),
  }))
  const target = targets.find(t => t.uid === serviceID)
  const state = connectionState(service, connection)
  const css = useStyles()

  useEffect(() => {
    analyticsHelper.page('ServiceDetailPage')
  }, [])

  if (!service || !device) return null

  const attributes = getAttributes([
    'serviceLastReported',
    'serviceName',
    'servicePort',
    'serviceProtocol',
    'serviceType',
    'owner',
    'serviceId',
    'license',
  ])

  return (
    <ServiceHeaderMenu
      device={device}
      service={service}
      target={target}
      footer={
        !remoteUI && (
          <>
            <Gutters className={css.gutters} noBottom>
              <ComboButton connection={connection} service={service} size="medium" fullWidth />
              {/* <Icon name="neuter" /> */}
              {connection?.enabled ? (
                <>
                  <Tooltip title="Configure Connection" arrow>
                    <IconButton to={`/connections/${service.id}`} component={Link}>
                      <Icon name="arrow-right" size="md" fixedWidth />
                    </IconButton>
                  </Tooltip>
                  <CopyButton connection={connection} service={service} />
                  <LaunchButton connection={connection} service={service} />
                </>
              ) : (
                <>
                  <Tooltip title="Configure Connection" arrow>
                    <IconButton to={`/connections/new/${device.id}/${service.id}`} component={Link}>
                      <Icon name="arrow-right" size="md" fixedWidth />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Gutters>
            <Gutters>
              <ConnectionDetails connection={connection} show={connection?.enabled} />
            </Gutters>
          </>
        )
      }
    >
      {service.state === 'inactive' && (
        <Notice severity="warning" gutterTop>
          Service offline
        </Notice>
      )}
      <Gutters>
        <DataDisplay attributes={attributes} device={device} service={service} />
      </Gutters>
    </ServiceHeaderMenu>
  )
}

const useStyles = makeStyles({
  gutters: {
    display: 'flex',
  },
})
