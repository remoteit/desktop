import React, { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { IconButton, makeStyles, Tooltip } from '@material-ui/core'
import { ServiceAttributes } from '../../components/ServiceAttributes'
import { ServiceHeaderMenu } from '../../components/ServiceHeaderMenu'
import { ConnectionDetails } from '../../components/ConnectionDetails'
import { ComboButton } from '../../buttons/ComboButton'
import { isRemoteUI } from '../../helpers/uiHelper'
import { GuideStep } from '../../components/GuideStep'
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
  const { ui } = useDispatch<Dispatch>()
  const css = useStyles()

  useEffect(() => {
    analyticsHelper.page('ServiceDetailPage')
  }, [])

  if (!service || !device) return null

  return (
    <ServiceHeaderMenu
      device={device}
      service={service}
      target={target}
      footer={
        !remoteUI && (
          <>
            <ConnectionDetails connection={connection} show={connection?.enabled} />
            <GuideStep guide="guideAWS" step={5} instructions="Now enable the connect on demand listener.">
              <Gutters className={css.gutters}>
                <ComboButton
                  connection={connection}
                  service={service}
                  size="medium"
                  onClick={() => ui.guide({ guide: 'guideAWS', step: 6 })}
                  fullWidth
                />
                {connection?.enabled ? (
                  <Tooltip title="Configure Connection" arrow>
                    <IconButton to={`/connections/${service.id}`} component={Link}>
                      <Icon name="chart-network" size="md" fixedWidth />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Configure Connection" arrow>
                    <IconButton to={`/connections/new/${device.id}/${service.id}`} component={Link}>
                      <Icon name="chart-network" size="md" fixedWidth />
                    </IconButton>
                  </Tooltip>
                )}
              </Gutters>
            </GuideStep>
          </>
        )
      }
    >
      {service.state === 'inactive' && (
        <Notice severity="warning" gutterTop>
          Service offline
        </Notice>
      )}
      <ServiceAttributes service={service} />
    </ServiceHeaderMenu>
  )
}

const useStyles = makeStyles({
  gutters: {
    display: 'flex',
  },
})
