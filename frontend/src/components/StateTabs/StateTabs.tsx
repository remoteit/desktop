import React from 'react'
import { Tabs, Tab } from '@material-ui/core'
import { ConnectionStateIcon } from '../ConnectionStateIcon'

export interface StateTabsProps {
  handleChange: (state: Tab) => void
  state: Tab
}

export function StateTabs({ handleChange, state = 'devices' }: StateTabsProps) {
  const tabs = ['connections', 'devices']
  const labels: any = {
    connections: 'Connections',
    devices: 'Devices',
  }
  return (
    <Tabs
      value={tabs.indexOf(state)}
      onChange={(e, v) => handleChange(tabs[v] as Tab)}
      variant="fullWidth"
      indicatorColor="primary"
      textColor="primary"
      className="bb bc-gray-light"
    >
      {tabs.map(tab => (
        <Tab
          label={
            <span className="df ai-center jc-center">
              <ConnectionStateIcon
                key={tab}
                state={tab === 'connections' ? 'connected' : 'active'}
                fixedWidth
                size="lg"
                className="mr-sm"
              />
              {labels[tab]}
              {/*<span className="bg-gray-lighter rad-md gray px-xs py-xxs txt-xs ml-sm">
                {23}
              </span>*/}
            </span>
          }
          key={tab}
        />
      ))}
    </Tabs>
  )
}
