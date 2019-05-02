import classnames from 'classnames'
import React from 'react'
import './Icon.css'

export declare interface IconProps {
  className?: string
  color?: BrandColors
  fixedWidth?: boolean
  name: string
  title?: string
  size?: FontSizes
  spin?: boolean
  weight?: IconWeight
}

export function Icon({
  className,
  color,
  fixedWidth = false,
  name,
  size,
  spin,
  weight = 'light',
  ...props
}: IconProps) {
  const classes = classnames(
    `fa${weight[0]}`,
    `fa-${name}`,
    color && color,
    { [`txt-${size}`]: size, 'fa-spin': spin, 'fa-fw': fixedWidth },
    className
  )
  return <span className={classes} {...props} />
}
