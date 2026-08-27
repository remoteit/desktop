import React from 'react'
import browser from '../services/browser'
import { Box, SxProps, Theme } from '@mui/material'
import { spacing, toSxArray, scrollbarStyles, SCROLLBAR_WIDTH } from '../styling'

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

  return (
    <>
      {verticalOverflow && (
        <Box
          sx={theme => ({
            position: 'absolute',
            height: 30,
            zIndex: 7,
            width: '100%',
            right: horizontalOverflow ? `${scrollbarWidth}px` : undefined,
            bottom: horizontalOverflow ? `${scrollbarWidth}px` : 0,
            backgroundImage: `linear-gradient(transparent, ${theme.palette[bg].main})`,
            pointerEvents: 'none',
          })}
        />
      )}
      {verticalOverflow && fadeTop && (
        <Box
          sx={theme => ({
            position: 'absolute',
            height: 30,
            zIndex: 7,
            width: '100%',
            right: horizontalOverflow ? `${scrollbarWidth}px` : undefined,
            top: 0,
            backgroundImage: `linear-gradient(${theme.palette[bg].main}, transparent)`,
            pointerEvents: 'none',
          })}
        />
      )}
      {horizontalOverflow && (
        <Box
          sx={theme => ({
            position: 'absolute',
            width: 30,
            top: 0,
            bottom: `${scrollbarWidth}px`,
            zIndex: 7,
            right: `${scrollbarWidth}px`,
            backgroundImage: `linear-gradient(90deg, transparent, ${theme.palette[bg].main})`,
            pointerEvents: 'none',
          })}
        />
      )}
      <Box
        ref={bodyRef}
        className={className}
        style={maxHeight ? { maxHeight } : undefined}
        sx={[
          theme => scrollbarStyles(theme, { background: bg, width: scrollbarWidth }),
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
    </>
  )
}
