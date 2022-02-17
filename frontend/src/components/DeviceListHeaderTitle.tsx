import React from 'react'
import { makeStyles, Box } from '@material-ui/core'
import { Attribute } from '../helpers/attributes'
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
    <Box className={sticky ? css.sticky : css.title}>
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
    background: palette.white.main,
    paddingLeft: spacing.md,
  },
  title: {
    paddingLeft: spacing.xxs,
    paddingRight: spacing.sm,
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
    '&:hover::after': {
      content: '""',
      width: 3,
      height: '100%',
      display: 'inline-block',
      background: palette.primary.main,
    },
  },
}))
