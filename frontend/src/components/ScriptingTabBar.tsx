import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { Tabs, Tab } from '@mui/material'

const tabs = ['scripts', 'runs' /* , 'files' */]
const tabTitles = ['Scripts', 'Runs', 'Assets']

export const ScriptingTabBar: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()
  const active = location.pathname.split('/')[1]
  const tabIndex = tabs.indexOf(active)

  return (
    <Tabs
      value={tabIndex === -1 ? 0 : tabIndex}
      variant="scrollable"
      TabIndicatorProps={{ sx: { display: 'none' } }}
      sx={{ marginX: 3, marginY: 1 }}
    >
      {tabs.map((tab, index) => (
        <Tab
          key={tab}
          label={tabTitles[index]}
          onClick={() => {
            const to = `/${tab}`
            dispatch.ui.setDefaultSelected({ key: '/scripts', value: to })
            history.push(to)
          }}
        />
      ))}
    </Tabs>
  )
}
