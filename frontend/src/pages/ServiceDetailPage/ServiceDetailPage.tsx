import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ServiceAttributes } from '../../components/ServiceAttributes'
import { ServiceHeaderMenu } from '../../components/ServiceHeaderMenu'
import analyticsHelper from '../../helpers/analyticsHelper'

export const ServiceDetailPage: React.FC<{ device?: IDevice; targets: ITarget[] }> = ({ device, targets }) => {
  const { serviceID } = useParams<{ serviceID: string }>()
  const service = device?.services.find(s => s.id === serviceID)
  const target = targets.find(t => t.uid === serviceID)

  useEffect(() => {
    analyticsHelper.page('ServiceDetailPage')
  }, [])

  if (!service || !device) return null

  return (
    <ServiceHeaderMenu device={device} service={service} target={target}>
      <ServiceAttributes service={service} />
    </ServiceHeaderMenu>
  )
}
