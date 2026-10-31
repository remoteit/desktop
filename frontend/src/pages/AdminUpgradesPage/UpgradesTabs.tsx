import React from 'react'
import { useHistory } from 'react-router-dom'
import { Tab, Tabs } from '@mui/material'
import { UPGRADES_ROUTE } from './rolloutHelpers'
import { DEFAULT_CHOICES, writeChoices } from './fleetHelpers'

// The Upgrades page's two views: the channels and their rollouts, and the fleet's versions.
export const UpgradesTabs: React.FC<{ value: 'rollouts' | 'fleet' }> = ({ value }) => {
  const history = useHistory()
  return (
    <Tabs value={value} TabIndicatorProps={{ sx: { display: 'none' } }} sx={{ minHeight: 0, marginTop: 1 }}>
      <Tab value="rollouts" label="Rollouts" data-tab="rollouts" onClick={() => history.push(UPGRADES_ROUTE)} />
      <Tab
        value="fleet"
        label="Fleet"
        data-tab="fleet"
        onClick={() => value !== 'fleet' && history.push(`${UPGRADES_ROUTE}${writeChoices(DEFAULT_CHOICES)}`)}
      />
    </Tabs>
  )
}
