import React, { useState } from 'react'
import browser from '../services/browser'
import { Box, SxProps, Theme } from '@mui/material'
import { spacing, toSxArray } from '../styling'

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
  horizontalOverflow,
  scrollbarBackground,
  children,
}) => {
  const [hover, setHover] = useState<boolean>(false)
  const scrollbarWidth = browser.isMobile ? 0 : 15
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
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        sx={[
          theme => ({
            flexGrow: 1,
            height: '100%',
            overflow: verticalOverflow && horizontalOverflow ? 'scroll' : 'auto',
            overscrollBehaviorX: 'none',
            position: 'relative',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { WebkitAppearance: 'none' },
            '&::-webkit-scrollbar:vertical': { width: `${scrollbarWidth}px` },
            '&::-webkit-scrollbar:horizontal': { height: `${scrollbarWidth}px` },
            '&::-webkit-scrollbar-corner': { background: theme.palette[bg].main },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: '8px',
              border: `4px solid ${theme.palette[bg].main}`,
              backgroundColor: theme.palette[bg].main,
            },
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
          hover
            ? (theme: Theme) => ({
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: `${theme.palette.grayLight.main} !important`,
                },
              })
            : {},
          ...toSxArray(sx),
        ]}
      >
        {children}
      </Box>
    </>
  )
}
