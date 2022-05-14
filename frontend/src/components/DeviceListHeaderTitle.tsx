import React from 'react'
import { makeStyles, Box } from '@material-ui/core'
import { Attribute } from './Attributes'
import { spacing } from '../styling'

type Props = {
  attribute: Attribute
  sticky?: boolean
  onMouseDown: (event: React.MouseEvent<HTMLSpanElement, MouseEvent>, Attribute) => void
  children?: React.ReactNode
}

export const DeviceListHeaderTitle: React.FC<Props> = ({ attribute, sticky, onMouseDown, children }) => {
  const css = useStyles()

  return (
    <Box
      className={sticky ? css.sticky : css.title}
      textAlign={attribute?.align}
      marginRight={attribute?.align === 'right' ? `${spacing.md}px` : undefined}
    >
      {children}
      {attribute.label}
      <span className={css.drag} onMouseDown={event => onMouseDown(event, attribute)} />
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  sticky: {
    left: 0,
    zIndex: 4,
    position: 'sticky',
    paddingLeft: spacing.md,
    backgroundImage: `linear-gradient(90deg, ${palette.white.main} 95%, transparent)`,
    borderBottom: `1px solid ${palette.grayLighter.main}`,
  },
  title: {
    paddingLeft: spacing.xxs,
    paddingRight: spacing.sm,
    backgroundColor: palette.white.main,
    borderBottom: `1px solid ${palette.grayLighter.main}`,
    position: 'relative',
    overflow: 'visible',
  },
  drag: {
    right: 0,
    height: '100%',
    position: 'absolute',
    width: spacing.md,
    '&:hover': {
      cursor: 'col-resize',
    },
    '&::after': {
      content: '""',
      width: 1,
      height: spacing.sm,
      display: 'inline-block',
      background: palette.grayLight.main,
    },
    '&:hover::after': {
      width: 3,
      height: '100%',
      background: palette.primary.main,
    },
  },
}))
