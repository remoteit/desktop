import React from 'react'
import { useTheme, Badge } from '@mui/material'
import { PlatformIcon } from './PlatformIcon'
import { fontSizes, spacing, Color, Sizes } from '../styling'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library, IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fal } from '@fortawesome/pro-light-svg-icons'
import { far } from '@fortawesome/pro-regular-svg-icons'
import { fas } from '@fortawesome/pro-solid-svg-icons'
import { R3gray } from '../assets/R3gray'

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
    // Custom icon name handling
    if (name === 'share') {
      name = 'arrow-up-from-bracket'
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

    const theme = useTheme()
    const styles: React.CSSProperties = { objectFit: 'contain' }

    if (color) styles.color = theme.palette[color]?.main || color
    if (inline) styles.marginLeft = size ? spacing[size] : spacing.md
    if (inlineLeft) styles.marginRight = size ? spacing[size] : spacing.md
    if (size) {
      styles.fontSize = fontSizes[size]
      styles.height = fontSizes[size]
      styles.maxWidth = `calc(${fontSizes[size]} + ${spacing.sm}px)`
    }
    if (fontSize) {
      styles.fontSize = fontSize
      styles.height = fontSize
      styles.maxWidth = `${fontSize + spacing.sm}px`
    }
    if (scale) styles.height = `calc(${styles.height || 0} * ${scale})`
    if (rotate) styles.transform = `rotate(${rotate}deg)`

    // Handling for different icon sources (platform-specific or FontAwesome)
    if (platformIcon || props.platform) return <PlatformIcon {...props} style={styles} name={name} />

    if (!name) return null

    // Handle special icon cases
    if (name === 'r3') return <R3gray {...props} style={styles} />

    let fontType: IconPrefix = 'far'

    switch (type) {
      case 'brands':
        fontType = 'fab'
        break
      case 'regular':
        fontType = 'far'
        break
      case 'solid':
        fontType = 'fas'
        break
      case 'light':
        fontType = 'fal'
        break
      default:
        fontType = 'far'
    }

    let icon = (
      <FontAwesomeIcon
        {...props}
        ref={ref as React.Ref<SVGSVGElement>}
        icon={[fontType, name as IconName]}
        spin={spin}
        fixedWidth={fixedWidth}
        style={styles}
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
