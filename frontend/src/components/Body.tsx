import React from 'react'
import browser from '../services/browser'
import { Box, SxProps, Theme } from '@mui/material'
import { spacing, toSxArray, scrollbarStyles, SCROLLBAR_WIDTH } from '../styling'

const FADE_SIZE = 30

/* Alpha stops for one edge of the scroll surface. `black` and `transparent` are mask
   alpha values here, not palette colours — which is the point: a mask dissolves the
   CONTENT, so unlike a painted gradient it needs to know nothing about what it is
   sitting on, and it lines up with the scroll box by construction.

   `gutter` is the scrollbar strip at the far end, left opaque so the bar itself does
   not dissolve along with the content. Nothing else is painted there — the content box
   already excludes the strip — so holding it solid costs nothing. */
const fadeMask = (direction: 'to bottom' | 'to right', fadeStart: boolean, gutter: number) => {
  const start = fadeStart ? `transparent, black ${FADE_SIZE}px` : 'black'
  const end = gutter
    ? `black calc(100% - ${FADE_SIZE + gutter}px), transparent calc(100% - ${gutter}px), black calc(100% - ${gutter}px)`
    : `black calc(100% - ${FADE_SIZE}px), transparent`
  return `linear-gradient(${direction}, ${start}, ${end})`
}

export type BodyProps = {
  inset?: boolean
  center?: boolean
  flex?: boolean
  bodyRef?: React.RefObject<HTMLDivElement>
  className?: string
  sx?: SxProps<Theme>
  maxHeight?: string
  gutterBottom?: boolean
  gutterTop?: boolean
  verticalOverflow?: boolean
  /** Also fade the TOP edge of the vertical overflow. Opt-in so existing
   *  scroll surfaces keep their single bottom fade. */
  fadeTop?: boolean
  horizontalOverflow?: boolean
  scrollbarBackground?: Color
  children?: React.ReactNode
}

export const Body: React.FC<BodyProps> = ({
  inset,
  center,
  flex,
  bodyRef,
  maxHeight,
  className,
  sx,
  gutterBottom,
  gutterTop,
  verticalOverflow,
  fadeTop,
  horizontalOverflow,
  scrollbarBackground,
  children,
}) => {
  const scrollbarWidth = browser.isMobile ? 0 : SCROLLBAR_WIDTH
  const bg: Color = scrollbarBackground || 'white'

  /* Both bars take space when the surface scrolls in both directions (overflow:
     scroll below), so that is when the fades hold back off the scrollbar strips. */
  const gutter = horizontalOverflow ? scrollbarWidth : 0
  const masks = [
    verticalOverflow && fadeMask('to bottom', !!fadeTop, gutter),
    horizontalOverflow && fadeMask('to right', false, gutter),
  ].filter(Boolean)
  const mask = masks.join(', ')

  return (
    <Box
      ref={bodyRef}
      className={className}
      style={maxHeight ? { maxHeight } : undefined}
      sx={[
        theme => scrollbarStyles(theme, { background: bg, width: scrollbarWidth }),
        mask
          ? {
              // -webkit- first so the standard property wins where both are understood
              WebkitMaskImage: mask,
              maskImage: mask,
              WebkitMaskComposite: 'source-in',
              maskComposite: 'intersect',
            }
          : {},
        theme => ({
          flexGrow: 1,
          height: '100%',
          overflow: verticalOverflow && horizontalOverflow ? 'scroll' : 'auto',
          overscrollBehaviorX: 'none',
          position: 'relative',
          WebkitOverflowScrolling: 'touch',
          [theme.breakpoints.down('sm')]: {
            overflowX: 'hidden',
          },
          // forces right scrollbar to appear (overflow: scroll causes extra padding)
          ...(horizontalOverflow ? { '& > *:first-of-type': { minHeight: '100.1%' } } : {}),
        }),
        flex
          ? {
              display: 'flex',
              alignContent: 'flex-start',
              flexWrap: 'wrap',
              justifyContent: 'space-evenly',
            }
          : {},
        center
          ? {
              display: 'flex',
              alignItems: 'center',
              justifyContent: verticalOverflow && browser.isAndroid ? undefined : 'center',
              flexDirection: 'column',
              padding: `${spacing.md}px ${spacing.md}px ${spacing.xl}px`,
            }
          : {},
        inset ? { padding: `${spacing.sm}px ${spacing.xl}px` } : {},
        gutterBottom ? { paddingBottom: `${spacing.xxl}px` } : {},
        gutterTop ? { paddingTop: `${spacing.sm}px` } : {},
        ...toSxArray(sx),
      ]}
    >
      {children}
    </Box>
  )
}
