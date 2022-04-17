import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'

export const GlobalTrigger: React.FC<IGlobalTooltip> = ({ title, color, children }) => {
  const { ui } = useDispatch<Dispatch>()

  return (
    <span
      onMouseEnter={event => {
        ui.set({ globalTooltip: { el: event.currentTarget, title, color } })
      }}
      onMouseLeave={() => {
        ui.set({ globalTooltip: undefined })
      }}
    >
      {children}
    </span>
  )
}
