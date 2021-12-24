import React from 'react'
import { fontSizes, spacing, Color, FontSize } from '../../styling'
import { fal, IconName, IconPrefix } from '@fortawesome/pro-light-svg-icons'
import { makeStyles, Badge } from '@material-ui/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/pro-regular-svg-icons'
import { fas } from '@fortawesome/pro-solid-svg-icons'
import { OpenWrt } from '../../assets/OpenWrt'
import { Nvidia } from '../../assets/Nvidia'
import { R3 } from '../../assets/R3'
import classnames from 'classnames'

library.add(fal, fab, far, fas)
export interface IconProps {
  name?: string
  color?: Color | string
  className?: string
  title?: string
  fixedWidth?: boolean
  onClick?: () => void
  size?: FontSize
  rotate?: number
  spin?: boolean
  type?: IconType
  inline?: boolean
  inlineLeft?: boolean
  modified?: boolean
}

export type Ref = HTMLSpanElement

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ color, fixedWidth, name, size, rotate, spin, type = 'regular', inline, inlineLeft, modified, ...props }, ref) => {
    if (name === 'port') {
      name = 'neuter'
      rotate = 90
    }
    if (name === 'launch') {
      name = 'arrow-right'
      rotate = -45
    }

    const css = useStyles({ color, inline, inlineLeft, size, rotate })
    if (!name) return null

    // Special Icon Handling
    if (name === 'r3') return <R3 className={css.icon} {...props} />
    if (name === 'nvidia') return <Nvidia className={css.icon} {...props} />
    if (name === 'openwrt') return <OpenWrt className={css.icon} {...props} />

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
        forwardedRef={ref}
        icon={[fontType, name as IconName]}
        spin={spin}
        fixedWidth={fixedWidth}
        className={classnames(css.icon, props.className)}
        {...props}
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
  icon: ({ color, inline, inlineLeft, size, rotate }: IconProps) => {
    const styles: any = {}
    if (color) styles.color = palette[color]?.main || color
    if (inline) styles.marginLeft = size ? fontSizes[size] : spacing.md
    if (inlineLeft) styles.marginRight = size ? fontSizes[size] : spacing.md
    if (size) styles.fontSize = styles.height = fontSizes[size]
    if (rotate) styles.transform = `rotate(${rotate}deg)`
    return styles
  },
}))
