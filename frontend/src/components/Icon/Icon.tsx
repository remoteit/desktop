import React from 'react'
import { fontSizes, colors, spacing, Color, FontSize } from '../../styling'
import { fal, IconName, IconPrefix } from '@fortawesome/pro-light-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/pro-regular-svg-icons'
import { fas } from '@fortawesome/pro-solid-svg-icons'

library.add(fal, fab, far, fas)
export interface IconProps {
  className?: string
  color?: Color
  fixedWidth?: boolean
  name?: string
  onClick?: () => void
  size?: FontSize
  spin?: boolean
  type?: IconType
  inline?: boolean
  inlineLeft?: boolean
}

export type Ref = HTMLSpanElement

export const Icon = React.forwardRef(
  ({ color, fixedWidth, name, size, spin, type = 'light', inline, inlineLeft, ...props }: IconProps): JSX.Element => {
    const styles: any = {}
    if (color) styles.color = colors[color]
    if (inline) styles.marginLeft = size ? fontSizes[size] / 2 : spacing.md
    if (inlineLeft) styles.marginRight = size ? fontSizes[size] / 2 : spacing.md
    if (size) styles.fontSize = fontSizes[size]

    let fontType: IconPrefix = 'fal'

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
    }

    return (
      <FontAwesomeIcon
        style={styles}
        icon={[fontType, name as IconName]}
        {...props}
        spin={spin}
        fixedWidth={fixedWidth}
      />
    )
  }
)
