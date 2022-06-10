import React from 'react'
import { fontSizes, spacing, Color, FontSize } from '../../styling'
import { fal, IconName, IconPrefix } from '@fortawesome/pro-light-svg-icons'
import { makeStyles, Badge } from '@material-ui/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { PlatformIcon } from '../PlatformIcon'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/pro-regular-svg-icons'
import { fas } from '@fortawesome/pro-solid-svg-icons'
import { R3gray } from '../../assets/R3gray'
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
      type = 'regular',
      inline,
      inlineLeft,
      modified,
      ...props
    },
    ref
  ) => {
    if (name === 'port') {
      name = 'neuter'
      rotate = 90
    }
    if (name === 'launch') {
      name = 'arrow-right'
      rotate = -45
    }

    const css = useStyles({ color, inline, inlineLeft, size, rotate, fontSize })

    // Platform icons
    if (props.platform || platformIcon) return <PlatformIcon name={name} className={css.icon} {...props} />

    // No icon
    if (!name) return null

    // Special Icon Handling
    if (name === 'r3') return <R3gray className={css.icon} {...props} />

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
        forwardedRef={ref}
        icon={[fontType, name as IconName]}
        spin={spin}
        fixedWidth={fixedWidth}
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
  icon: ({ color, inline, inlineLeft, size, fontSize, rotate }: IconProps) => {
    const styles: any = {}
    if (color) styles.color = palette[color] ? palette[color].main : color
    if (inline) styles.marginLeft = size ? fontSizes[size] : spacing.md
    if (inlineLeft) styles.marginRight = size ? fontSizes[size] : spacing.md
    if (size) styles.fontSize = styles.height = fontSizes[size]
    if (fontSize) styles.fontSize = styles.height = fontSize
    if (rotate) styles.transform = `rotate(${rotate}deg)`
    if (styles.fontSize) styles.maxWidth = styles.fontSize + spacing.sm
    return styles
  },
}))
