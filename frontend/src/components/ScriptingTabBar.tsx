import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { Tab } from '@mui/material'
import { PageTabs } from './PageTabs'

const tabs = ['scripts', 'runs', 'files'] as const
const singular: Record<string, (typeof tabs)[number]> = { script: 'scripts', run: 'runs', file: 'files' }

export const ScriptingTabBar: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()
  const active = location.pathname.split('/')[1]
  const titles = {
    scripts: t('scriptingTabs.scripts', 'Scripts'),
    runs: t('scriptingTabs.runs', 'Runs'),
    files: t('scriptingTabs.files', 'Files'),
  }

  return (
    <PageTabs value={tabs.find(tab => tab === active) ?? singular[active] ?? 'scripts'} sx={{ borderBottom: 'none', minHeight: 0 }}>
      {tabs.map(tab => (
        <Tab
          key={tab}
          value={tab}
          label={titles[tab]}
          onClick={() => {
            const to = `/${tab}`
            dispatch.ui.setDefaultSelected({ key: '/scripts', value: to })
            history.push(to)
          }}
        />
      ))}
    </PageTabs>
  )
}
