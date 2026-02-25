import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import React from 'react'
import { spacing } from '../styling'
import { Attribute } from './Attributes'

type Props<TOptions = IDataOptions> = {
  attribute: Attribute<TOptions>
  sticky?: boolean
  onMouseDown: (event: React.MouseEvent<HTMLSpanElement, MouseEvent>, attribute: Attribute<TOptions>) => void
  children?: React.ReactNode
}

export const GridListHeaderTitle = <TOptions,>({ attribute, sticky, onMouseDown, children }: Props<TOptions>) => {
  const css = useStyles()
  const justifyContent =
    attribute?.align === 'center' ? 'center' : attribute?.align === 'right' ? 'flex-end' : undefined

  const stickyCenter = sticky && justifyContent === 'center'

  return (
    <Box
      className={sticky ? css.sticky : css.title}
      textAlign={attribute?.align}
      marginRight={attribute?.align === 'right' ? `${spacing.md}px` : undefined}
      sx={stickyCenter ? { paddingLeft: 0, justifyContent: 'center' } : undefined}
    >
      <span className={css.text} style={justifyContent ? { justifyContent, width: '100%' } : undefined}>
        {children}
        {attribute.label}
      </span>
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
    paddingLeft: spacing.xs,
    paddingRight: `${spacing.sm}px !important`,
    backgroundColor: palette.white.main,
    position: 'relative',
  },
  text: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    '& .hoverHide': { opacity: 0, transition: 'opacity 200ms' },
    '&:hover .hoverHide': { opacity: 1, transition: 'opacity 200ms' },
  },
  drag: {
    right: 0,
    height: '100%',
    position: 'absolute',
    width: spacing.md,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    '&:hover': {
      cursor: 'col-resize',
    },
    '&::after': {
      content: '""',
      width: 1,
      height: spacing.sm,
      display: 'block',
      background: palette.grayLight.main,
    },
    '&:hover::after': {
      width: 3,
      height: '100%',
      background: palette.primary.main,
    },
  },
}))
