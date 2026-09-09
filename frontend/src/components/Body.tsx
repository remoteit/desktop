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
   not dissolve along with the content. It is MEASURED rather than assumed: an overlay
   scrollbar (the macOS default) floats over the content and reserves nothing, so
   holding a strip back there leaves a hard band of un-faded content where no bar is —
   which is what the old painted gradients did. A classic bar does reserve the strip,
   and nothing else is painted under it, so holding it solid costs nothing there. */
const fadeMask = (direction: 'to bottom' | 'to right', fadeStart: boolean, gutter: number) => {
  const start = fadeStart ? `transparent, black ${FADE_SIZE}px` : 'black'
  const end = gutter
    ? `black calc(100% - ${FADE_SIZE + gutter}px), transparent calc(100% - ${gutter}px), black calc(100% - ${gutter}px)`
    : `black calc(100% - ${FADE_SIZE}px), transparent`
  return `linear-gradient(${direction}, ${start}, ${end})`
}

/* How wide the scrollbars actually are on this surface — 0 for overlay bars. Watched
   rather than read once: with overflow:auto the bar comes and goes with the content,
   and that changes the content box, which is what ResizeObserver reports by default. */
const useScrollbarGutter = (ref: React.RefObject<HTMLDivElement>): number => {
  const [gutter, setGutter] = React.useState(0)
  React.useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () =>
      setGutter(Math.max(element.offsetWidth - element.clientWidth, element.offsetHeight - element.clientHeight))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return gutter
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
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const gutter = useScrollbarGutter(scrollRef)

  // Callers pass a ref to drive the scroll position (see ChatMessages); the measurement
  // needs the same node, so hand it to both
  const setScrollRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node
      if (bodyRef) (bodyRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    },
    [bodyRef]
  )
  const masks = [
    verticalOverflow && fadeMask('to bottom', !!fadeTop, gutter),
    horizontalOverflow && fadeMask('to right', false, gutter),
  ].filter(Boolean)
  const mask = masks.join(', ')

  return (
    <Box
      ref={setScrollRef}
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
