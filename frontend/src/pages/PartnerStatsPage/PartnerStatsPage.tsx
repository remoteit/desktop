import React from 'react'
import { useSelector } from 'react-redux'
import { State } from '../../store'
import { DynamicPanel } from '../../components/DynamicPanel'
import { PartnerStatsListPage } from './PartnerStatsListPage'
import { PartnerStatsDetailPanel } from './PartnerStatsDetailPanel'

export const PartnerStatsPage: React.FC = () => {
  const layout = useSelector((state: State) => state.ui.layout)

  return (
    <DynamicPanel
      primary={<PartnerStatsListPage />}
      secondary={<PartnerStatsDetailPanel />}
      layout={layout}
      root="/partner-stats"
    />
  )
}
