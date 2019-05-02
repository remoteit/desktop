import React, { useState } from 'react'
import { Tabs, Tab } from '@material-ui/core'
import { DeviceState } from 'remote.it'
import { ConnectionStateIcon } from '../ConnectionStateIcon'

export interface StateTabsProps {
  handleChange: (state: DeviceState) => void
  state: DeviceState
}

export function StateTabs({ handleChange, state = 'active' }: StateTabsProps) {
  const tabs = ['connected', 'active', 'inactive']
  const labels: any = {
    connected: 'Connected',
    active: 'Online',
    inactive: 'Offline',
  }
  return (
    <Tabs
      value={tabs.indexOf(state)}
      onChange={(e, v) => handleChange(tabs[v] as DeviceState)}
      variant="fullWidth"
      indicatorColor="primary"
      textColor="primary"
    >
      {tabs.map(tab => (
        <Tab
          label={labels[tab]}
          key={tab}
          icon={
            <ConnectionStateIcon
              key={tab}
              state={tab as DeviceState}
              fixedWidth
              size="lg"
            />
          }
        />
      ))}
    </Tabs>
  )
}
