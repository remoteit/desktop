// import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { REGEX_FIRST_PATH } from '../constants'
import { useLocation } from 'react-router-dom'

export function usePanelWidth(suffix?: string): [number, (value: number) => void] {
  const { ui } = useDispatch<Dispatch>()
  const location = useLocation()

  const match = location.pathname.match(REGEX_FIRST_PATH)
  const raw = match ? match[0].substring(1) : ''
  const normalizeKey = (key: string) => {
    switch (key) {
      case 'file':
        return 'files'
      case 'script':
        return 'scripts'
      case 'run':
        return 'runs'
      default:
        return key
    }
  }
  const resize = normalizeKey(raw)
  const key = suffix ? `${resize}-${suffix}` : resize
  const panelWidth = useSelector((state: State) => state.ui.panelWidth)

  const setPanelWidth = (value: number) => {
    console.log('setPanelWidth', key, value)
    ui.setPersistent({ panelWidth: { ...panelWidth, [key]: value } })
  }

  return [panelWidth[key] || 9999, setPanelWidth]
}
