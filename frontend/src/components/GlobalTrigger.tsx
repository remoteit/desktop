import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'

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
