import React from 'react'
import { fontSizes, colors, spacing, Color, FontSize } from '../../styling'
import { fal, IconName, IconPrefix } from '@fortawesome/pro-light-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/pro-regular-svg-icons'
import { fas } from '@fortawesome/pro-solid-svg-icons'
import { R3 } from '../../assets/R3'

library.add(fal, fab, far, fas)
export interface IconProps {
  name?: string
  color?: Color | string
  className?: string
  fixedWidth?: boolean
  onClick?: () => void
  size?: FontSize
  rotate?: number
  spin?: boolean
  type?: IconType
  inline?: boolean
  inlineLeft?: boolean
}

export type Ref = HTMLSpanElement

export const Icon = React.forwardRef(
  ({ color, fixedWidth, name, size, rotate, spin, type = 'regular', inline, inlineLeft, ...props }: IconProps) => {
    const styles: any = {}
    if (!name) return null

    // Special Icon Handling
    if (name === 'r3') return <R3 style={styles} height={styles.fontSize} {...props} />
    if (name === 'port') {
      name = 'neuter'
      rotate = 90
    }
    if (name === 'launch') {
      name = 'arrow-right'
      rotate = -45
    }

    if (color) styles.color = colors[color] || color
    if (inline) styles.marginLeft = size ? fontSizes[size] : spacing.md
    if (inlineLeft) styles.marginRight = size ? fontSizes[size] : spacing.md
    if (size) styles.fontSize = fontSizes[size]
    if (rotate) styles.transform = `rotate(${rotate}deg)`

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

    return (
      <FontAwesomeIcon
        style={styles}
        icon={[fontType, name as IconName]}
        spin={spin}
        fixedWidth={fixedWidth}
        {...props}
      />
    )
  }
)
