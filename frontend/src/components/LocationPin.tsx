import React from 'react'
import { Icon } from './Icon'
import { Tooltip } from '@mui/material'

export interface Props {
  session?: ISession
}

export const LocationPin: React.FC<Props> = ({ session }) => {
  if (!session) return null

  let cityState: string[] = []

  if (session.geo?.city) cityState.push(session.geo.city)
  if (session.geo?.stateName) cityState.push(session.geo.stateName)

  let title: string[] = []

  if (cityState.length) title.push(cityState.join(', '))
  if (session.geo?.countryName) title.push(session.geo.countryName)

  return (
    <Tooltip title={title.join(' - ')}>
      <span>
        <Icon name="map-marker-alt" type="solid" size="xs" inlineLeft />
      </span>
    </Tooltip>
  )
}
