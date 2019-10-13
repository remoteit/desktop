import classnames from 'classnames'
import React from 'react'
import './Icon.css'
import styles, { FontSize } from '../../styling'

export interface IconProps {
  className?: string
  color?: BrandColors
  fixedWidth?: boolean
  name?: string
  onClick?: () => void
  title?: string
  size?: FontSize
  spin?: boolean
  weight?: IconWeight
  inline?: boolean
}

export type Ref = HTMLSpanElement

export const Icon = React.forwardRef<Ref, IconProps>(
  ({ className, color, fixedWidth = false, name, size, spin, weight = 'light', inline, ...props }, ref) => {
    if (!name) return null

    const classes = classnames(
      { 'fa-spin': spin, 'fa-fw': fixedWidth, '': inline },
      `fa${weight[0]}`,
      `fa-${name}`,
      color && color,
      className
    )
    return (
      <span
        className={classes}
        {...props}
        style={{
          marginLeft: inline ? styles.spacing.md : 'inherit',
          fontSize: size ? styles.fontSizes[size] : 'inherit',
        }}
        ref={ref}
      />
    )
  }
)
