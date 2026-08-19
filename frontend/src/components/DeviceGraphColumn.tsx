import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceListContext } from '../services/Context'
import { GraphColumn } from './GraphColumn'

export const DeviceGraphColumn: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceListContext)
  return <GraphColumn title={t('deviceGraphColumn.title', 'Device Graph')} timeSeries={device?.timeSeries} />
}
