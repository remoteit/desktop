import classnames from 'classnames'
import React from 'react'
import './Icon.css'

export interface Props {
  className?: string
  color?: BrandColors
  name: string
  title?: string
  size?: FontSizes
  spin?: boolean
  weight?: IconWeight
}

export function Icon({
  className,
  color,
  name,
  size,
  spin,
  weight = 'light',
  ...props
}: Props) {
  const classes = classnames(
    `fa${weight[0]}`,
    `fa-${name}`,
    color && color,
    { [`txt-${size}`]: size, 'fa-spin': spin },
    className
  )
  return <span className={classes} {...props} />
}
