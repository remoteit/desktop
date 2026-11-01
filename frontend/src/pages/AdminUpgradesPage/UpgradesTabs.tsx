import React from 'react'
import { useHistory } from 'react-router-dom'
import { Tab, Tabs } from '@mui/material'
import { UPGRADES_ROUTE } from './rolloutHelpers'
import { FLEET_VIEW } from './fleetHelpers'

// The Upgrades page's two views: the channels and their rollouts, and the fleet's versions — grouped as this API's
// default unless the URL says (fleetHelpers' defaultGrouping).
export const UpgradesTabs: React.FC<{ value: 'rollouts' | 'fleet' }> = ({ value }) => {
  const history = useHistory()
  return (
    <Tabs value={value} TabIndicatorProps={{ sx: { display: 'none' } }} sx={{ minHeight: 0, marginTop: 1 }}>
      <Tab value="rollouts" label="Rollouts" data-tab="rollouts" onClick={() => history.push(UPGRADES_ROUTE)} />
      <Tab
        value="fleet"
        label="Fleet"
        data-tab="fleet"
        onClick={() => value !== 'fleet' && history.push(`${UPGRADES_ROUTE}?view=${FLEET_VIEW}`)}
      />
    </Tabs>
  )
}
