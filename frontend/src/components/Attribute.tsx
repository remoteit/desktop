import React from 'react'
import { spacing } from '../styling'

export const Attribute = (value, indent: number = 0) => {
  if (Array.isArray(value)) return value.join(', ')

  if (typeof value === 'object')
    return Object.keys(value).map(key => (
      <div key={key} style={{ marginLeft: indent }}>
        {key}: {Attribute(value[key], spacing.md)}
      </div>
    ))

  return value.toString()
}
