import React from 'react'
import { Duration } from './Duration'

export const Formats = {
  element: (el: JSX.Element) => {
    return el
  },
  duration: (date: Date) => {
    if (date instanceof Date) return <Duration startTime={date.getTime()} ago />
  },
  percent: (value: number) => {
    if (value) return Math.round(value) + '%'
  },
  round: (value: number) => {
    return Math.round(value * 10) / 10
  },
  location: (geo: IDevice['geo']) => {
    if (!geo) return null
    return (
      <>
        {geo.city}
        <br />
        {geo.stateName}
        <br />
        {geo.countryName}
      </>
    )
  },
}
