// import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useLocation } from 'react-router-dom'

export function usePanelWidth(): [number, (value: number) => void] {
  const { ui } = useDispatch<Dispatch>()
  const location = useLocation()

  const match = location.pathname.match(REGEX_FIRST_PATH)
  const resize = match ? match[0].substring(1) : ''
  const panelWidth = useSelector((state: ApplicationState) => state.ui.panelWidth)

  const setPanelWidth = (value: number) => {
    ui.set({
      panelWidth: {
        ...panelWidth,
        [resize]: value,
      },
    })
  }

  return [panelWidth[resize] || 9999, setPanelWidth]
}
