import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { REGEX_LAST_PATH } from '../constants'
import { useHistory, useLocation } from 'react-router-dom'
import { Tabs, Tab } from '@mui/material'
import { MasterTab } from './MasterTab'

const tabs = ['/scripts', '/runs' /* , '/files' */]
const tabTitles = ['Scripts', 'Runs', 'Assets']

export const ScriptingTabBar: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()
  const active = location.pathname.match(REGEX_LAST_PATH)?.[0] || ''
  const tabIndex = tabs.indexOf(active)

  return (
    <Tabs
      value={tabIndex === -1 ? 0 : tabIndex}
      variant="scrollable"
      TabIndicatorProps={{ sx: { display: 'none' } }}
      sx={{ marginX: 3, marginY: 1 }}
    >
      {tabs.map((tab, index) => {
        const TabType = index === 0 ? MasterTab : Tab
        return (
          <TabType
            key={tab}
            label={tabTitles[index]}
            onClick={() => {
              const to = `/scripting${tab}`
              dispatch.ui.setDefaultSelected({ key: '/scripting', value: to })
              history.push(to)
            }}
          />
        )
      })}
    </Tabs>
  )
}
