import React, { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { IconButton, makeStyles, Tooltip } from '@material-ui/core'
import { ServiceHeaderMenu } from '../components/ServiceHeaderMenu'
import { selectConnection } from '../helpers/connectionHelper'
import { ComboButton } from '../buttons/ComboButton'
import { isRemoteUI } from '../helpers/uiHelper'
import { GuideStep } from '../components/GuideStep'
import { Connect } from '../components/Connect'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { colors } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

export const ServiceConnectPage: React.FC<{ device?: IDevice; targets: ITarget[] }> = ({ device, targets }) => {
  const { serviceID } = useParams<{ serviceID: string }>()
  const service = device?.services.find(s => s.id === serviceID)
  const { connection } = useSelector((state: ApplicationState) => ({
    connection: selectConnection(state, service),
  }))
  const target = targets.find(t => t.uid === serviceID)

  useEffect(() => {
    analyticsHelper.page('ServiceDetailPage')
  }, [])

  if (!service || !device) return null

  return (
    <ServiceHeaderMenu
      device={device}
      service={service}
      target={target}
      backgroundColor={connection.enabled ? colors.primaryHighlight : colors.grayLighter}
      // footer={
      //   !remoteUI && (
      //     <>
      //       <ConnectionDetails connection={connection} service={service} show={connection?.enabled} />
      //       <GuideStep guide="guideAWS" step={5} instructions="Now enable the connect on demand listener.">
      //         <Gutters className={css.gutters}>
      //           <ComboButton
      //             connection={connection}
      //             service={service}
      //             size="medium"
      //             onClick={() => ui.guide({ guide: 'guideAWS', step: 6 })}
      //             fullWidth
      //           />
      //           {connection?.enabled ? (
      //             <Tooltip title="Configure Connection" arrow>
      //               <IconButton to={`/connections/${service.id}`} component={Link}>
      //                 <Icon name="cog" size="md" color="primary" fixedWidth />
      //               </IconButton>
      //             </Tooltip>
      //           ) : (
      //             <Tooltip title="Configure Connection" arrow>
      //               <IconButton to={`/connections/new/${device.id}/${service.id}`} component={Link}>
      //                 <Icon name="cog" size="md" fixedWidth />
      //               </IconButton>
      //             </Tooltip>
      //           )}
      //         </Gutters>
      //       </GuideStep>
      //     </>
      //   )
      // }
    >
      {service.state === 'inactive' && (
        <Notice severity="warning" gutterTop>
          Service offline
        </Notice>
      )}
      <Connect />
    </ServiceHeaderMenu>
  )
}