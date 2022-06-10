import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ServiceAttributes } from '../../components/ServiceAttributes'
import { ServiceHeaderMenu } from '../../components/ServiceHeaderMenu'
import analyticsHelper from '../../helpers/analyticsHelper'

export const ServiceDetailPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { serviceID } = useParams<{ serviceID: string }>()
  const service = device?.services.find(s => s.id === serviceID)

  useEffect(() => {
    analyticsHelper.page('ServiceDetailPage')
  }, [])

  if (!service || !device) return null

  return (
    <ServiceHeaderMenu device={device} service={service}>
      <ServiceAttributes service={service} />
    </ServiceHeaderMenu>
  )
}
