import React from 'react'
import { makeStyles } from '@mui/styles'
import { Badge } from '@mui/material'
import { PlatformIcon } from './PlatformIcon'
import { fontSizes, spacing, Color, Sizes } from '../styling'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library, IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fal } from '@fortawesome/pro-light-svg-icons'
import { far } from '@fortawesome/pro-regular-svg-icons'
import { fas } from '@fortawesome/pro-solid-svg-icons'
import { R3gray } from '../assets/R3gray'
import classnames from 'classnames'

library.add(fal, fab, far, fas)

export interface IconProps {
  name?: string
  color?: Color | string
  platformIcon?: boolean
  platform?: number
  className?: string
  title?: string
  fixedWidth?: boolean
  fontSize?: number
  onClick?: (event: React.MouseEvent) => void
  size?: Sizes
  rotate?: number
  spin?: boolean
  scale?: number
  type?: IconType
  inline?: boolean
  inlineLeft?: boolean
  modified?: boolean
  currentColor?: boolean
}

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  (
    {
      color,
      platformIcon,
      fixedWidth,
      name,
      size = 'base',
      fontSize,
      rotate,
      spin,
      scale,
      type = 'regular',
      inline,
      inlineLeft,
      modified,
      ...props
    },
    ref
  ) => {
    if (name === 'share') {
      name = 'arrow-turn-right'
    }
    if (name === 'port') {
      name = 'neuter'
      rotate = 90
    }
    if (name === 'host') {
      name = 't'
      rotate = -90
    }
    if (name === 'launch') {
      name = 'arrow-right'
      rotate = -45
    }
    if (name === 'circle-medium') {
      name = 'circle'
      scale = 0.8
    }

    const css = useStyles({ color, inline, inlineLeft, size, rotate, fontSize, scale })

    // Platform icons
    if (props.platform || platformIcon)
      return <PlatformIcon {...props} className={classnames(props.className, css.icon)} name={name} />

    // No icon
    if (!name) return null

    // Special Icon Handling
    if (name === 'r3') return <R3gray {...props} className={classnames(props.className, css.icon)} />

    let fontType: IconPrefix = 'far'

    switch (type) {
      case 'brands': {
        fontType = 'fab'
        break
      }
      case 'regular': {
        fontType = 'far'
        break
      }
      case 'solid': {
        fontType = 'fas'
        break
      }
      case 'light': {
        fontType = 'fal'
        break
      }
    }

    let icon = (
      <FontAwesomeIcon
        {...props}
        ref={ref as React.Ref<SVGSVGElement>}
        icon={[fontType, name as IconName]}
        spin={spin}
        fixedWidth={fixedWidth}
        style={{
          // moved here because sometimes wouldn't render in class
          transform: rotate ? `rotate(${rotate}deg)` : undefined,
        }}
        className={classnames(props.className, css.icon)}
      />
    )

    if (modified)
      icon = (
        <Badge variant="dot" color="primary">
          {icon}
        </Badge>
      )

    return icon
  }
)

const useStyles = makeStyles(({ palette }) => ({
  icon: ({ color, inline, inlineLeft, size, fontSize, scale }: IconProps) => {
    const styles: any = { objectFit: 'contain' }
    if (color) styles.color = palette[color] ? palette[color].main : color
    if (inline) styles.marginLeft = size ? fontSizes[size] : spacing.md
    if (inlineLeft) styles.marginRight = size ? fontSizes[size] : spacing.md
    if (size) {
      styles.fontSize = styles.height = fontSizes[size]
      styles.maxWidth = `calc(${fontSizes[size]} + ${fontSizes.sm})`
    }
    if (fontSize) {
      styles.fontSize = styles.height = fontSize
      styles.maxWidth = fontSize + spacing.sm
    }
    if (scale) styles.height = `calc(${styles.height} * ${scale})`
    return styles
  },
}))
