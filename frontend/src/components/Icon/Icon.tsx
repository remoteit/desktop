import classnames from 'classnames'
import React from 'react'
import './Icon.css'
import { fontSizes, colors, spacing, Color, FontSize } from '../../styling'

export interface IconProps {
  className?: string
  color?: Color
  fixedWidth?: boolean
  name?: string
  onClick?: () => void
  title?: string
  size?: FontSize
  spin?: boolean
  weight?: IconWeight
  inline?: boolean
  inlineLeft?: boolean
}

export type Ref = HTMLSpanElement

export const Icon = React.forwardRef<Ref, IconProps>(
  ({ className, color, fixedWidth = false, name, size, spin, weight = 'light', inline, inlineLeft, ...props }, ref) => {
    if (!name) return null

    const classes = classnames(
      { 'fa-spin': spin, 'fa-fw': fixedWidth, '': inline },
      `fa${weight[0]}`,
      `fa-${name}`,
      className
    )

    const styles: any = {}
    if (color) styles.color = colors[color]
    if (inline) styles.marginLeft = size ? fontSizes[size] / 2 : spacing.md
    if (inlineLeft) styles.marginRight = size ? fontSizes[size] / 2 : spacing.md
    if (size) styles.fontSize = fontSizes[size]

    return <span className={classes} {...props} style={styles} ref={ref} />
  }
)
