import React from 'react'
import { REGEX_LAST_PATH } from '../constants'
import { useHistory, useLocation } from 'react-router-dom'
import { Tabs, Tab } from '@mui/material'

const tabs = ['/scripts', '/runs', '/files']
const tabTitles = ['Scripts', 'Runs', 'Files']

export const ScriptsTabBar: React.FC = () => {
  const location = useLocation()
  const history = useHistory()
  const active = location.pathname.match(REGEX_LAST_PATH)?.[0] || ''

  return (
    <Tabs
      value={tabs.indexOf(active)}
      variant="scrollable"
      TabIndicatorProps={{ sx: { display: 'none' } }}
      sx={{ marginX: 3, marginY: 1 }}
    >
      {tabs.map((tab, index) => (
        <Tab key={index} label={tabTitles[index]} onClick={() => history.push(`/scripting${tab}`)} />
      ))}
    </Tabs>
  )
}
