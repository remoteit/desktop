import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceListContext } from '../services/Context'
import { GraphColumn } from './GraphColumn'

export const ServiceGraphColumn: React.FC = () => {
  const { t } = useTranslation()
  const { service } = useContext(DeviceListContext)
  return <GraphColumn title={t('serviceGraphColumn.title', 'Service Graph')} timeSeries={service?.timeSeries} />
}
