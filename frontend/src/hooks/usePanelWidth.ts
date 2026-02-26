// import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { REGEX_FIRST_PATH } from '../constants'
import { useLocation } from 'react-router-dom'

const PANEL_WIDTH_DEFAULTS: Record<string, { default: number; primary?: number; secondary?: number }> = {
  devices: { default: 400 },
  networks: { default: 450 },
  connections: { default: 450 },
  files: { default: 450 },
  file: { default: 450 },
  settings: { default: 350 },
  account: { default: 300 },
  organization: { default: 350 },
  scripts: { default: 550 },
  script: { default: 400, primary: 330, secondary: 400 },
}

export function usePanelWidth(suffix?: string): [number, (value: number) => void] {
  const { ui } = useDispatch<Dispatch>()
  const location = useLocation()

  const match = location.pathname.match(REGEX_FIRST_PATH)
  const routeKey = match ? match[0].substring(1) : ''
  const key = suffix ? `${routeKey}-${suffix}` : routeKey
  const panelWidth = useSelector((state: State) => state.ui.panelWidth)
  const defaultWidth = suffix
    ? PANEL_WIDTH_DEFAULTS[routeKey]?.[suffix as 'primary' | 'secondary'] || 9999
    : PANEL_WIDTH_DEFAULTS[routeKey]?.default || 9999

  const setPanelWidth = (value: number) => {
    console.log('setPanelWidth', key, value)
    ui.setPersistent({ panelWidth: { ...panelWidth, [key]: value } })
  }

  return [panelWidth[key] || defaultWidth, setPanelWidth]
}
