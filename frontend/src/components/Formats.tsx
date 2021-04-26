import React from 'react'
import { Chip } from '@material-ui/core'
import { Duration } from './Duration'

export const Formats = {
  element: (el: JSX.Element) => {
    return el
  },
  duration: ({ start, end, ago }: { start: Date; end?: Date; ago?: boolean }) => {
    if (start instanceof Date)
      return <Duration startTime={start.getTime()} endTime={end ? end.getTime() : undefined} ago={ago} />
  },
  percent: (value: number) => {
    if (value) return Math.round(value) + '%'
  },
  round: (value: number) => {
    return Math.round(value * 10) / 10
  },
  chip: (value: ILicenseChip) => {
    return (
      <Chip
        style={{ color: value.color, backgroundColor: value.background, fontFamily: 'Roboto Mono' }}
        label={value.name}
        size="small"
      />
    )
  },
  location: (geo: IDevice['geo']) => {
    if (!geo) return null
    return (
      <>
        {geo.city && (
          <>
            {geo.city}
            <br />
          </>
        )}
        {geo.stateName && (
          <>
            {geo.stateName}
            <br />
          </>
        )}
        {geo.countryName && geo.countryName}
      </>
    )
  },
}
