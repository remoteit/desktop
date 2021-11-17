import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { ServiceHeaderMenu } from '../components/ServiceHeaderMenu'
import { selectConnection } from '../helpers/connectionHelper'
import { Connect } from '../components/Connect'
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
