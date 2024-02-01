import React, { useState } from 'react'
import browser from '../services/Browser'
import classnames from 'classnames'
import { spacing, Color } from '../styling'
import { makeStyles } from '@mui/styles'

export type BodyProps = {
  inset?: boolean
  center?: boolean
  flex?: boolean
  bodyRef?: React.RefObject<HTMLDivElement>
  className?: string
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
  className = '',
  gutterBottom,
  gutterTop,
  verticalOverflow,
  horizontalOverflow,
  scrollbarBackground,
  children,
}) => {
  const css = useStyles({
    horizontalOverflow,
    verticalOverflow,
    scrollbarWidth: browser.isMobile ? 0 : 15,
    scrollbarBackground: scrollbarBackground || 'white',
  })
  const [hover, setHover] = useState<boolean>(true)
  className = classnames(
    className,
    css.body,
    flex && css.flex,
    center && css.center,
    inset && css.inset,
    gutterBottom && css.gutterBottom,
    gutterTop && css.gutterTop,
    hover && css.showScroll
  )
  let style = maxHeight ? { maxHeight } : {}

  return (
    <>
      {verticalOverflow && <div className={css.verticalOverflow} />}
      {horizontalOverflow && <div className={css.horizontalOverflow} />}
      <div
        ref={bodyRef}
        className={className}
        style={style}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
      </div>
    </>
  )
}

type StyleProps = {
  verticalOverflow?: boolean
  horizontalOverflow?: boolean
  scrollbarWidth: number
  scrollbarBackground: Color
}

const useStyles = makeStyles(({ palette, breakpoints }) => ({
  body: ({ scrollbarBackground, verticalOverflow, horizontalOverflow, scrollbarWidth }: StyleProps) => ({
    flexGrow: 1,
    height: '100%',
    overflow: verticalOverflow && horizontalOverflow ? 'scroll' : 'auto',
    overscrollBehaviorX: 'none',
    position: 'relative',
    '-webkit-overflow-scrolling': 'touch',
    '&::-webkit-scrollbar': { '-webkit-appearance': 'none' },
    '&::-webkit-scrollbar:vertical': { width: scrollbarWidth },
    '&::-webkit-scrollbar:horizontal': { height: scrollbarWidth },
    '&::-webkit-scrollbar-corner': { background: palette[scrollbarBackground].main },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: 8,
      border: `4px solid ${palette[scrollbarBackground].main}`,
      backgroundColor: `${palette[scrollbarBackground].main}`,
    },
    [breakpoints.down('sm')]: {
      overflowX: 'hidden',
    },
    '& > *:first-of-type': horizontalOverflow ? { minHeight: '100.1%' } : undefined, // forces right scrollbar to appear (overflow: scroll causes extra padding)
  }),
  verticalOverflow: ({ horizontalOverflow, scrollbarWidth, scrollbarBackground }: StyleProps) => ({
    position: 'absolute',
    height: 30,
    zIndex: 7,
    width: '100%',
    right: horizontalOverflow ? scrollbarWidth : undefined,
    bottom: horizontalOverflow ? scrollbarWidth : 0,
    backgroundImage: `linear-gradient(transparent, ${palette[scrollbarBackground].main})`,
    pointerEvents: 'none',
  }),
  horizontalOverflow: ({ scrollbarWidth, scrollbarBackground }: StyleProps) => ({
    position: 'absolute',
    width: 30,
    top: 0,
    bottom: scrollbarWidth,
    zIndex: 7,
    right: scrollbarWidth,
    backgroundImage: `linear-gradient(90deg, transparent, ${palette[scrollbarBackground].main})`,
    pointerEvents: 'none',
  }),
  showScroll: {
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: `${palette.grayLight.main} !important`,
    },
  },
  flex: {
    display: 'flex',
    alignContent: 'flex-start',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
  },
  inset: {
    padding: `${spacing.sm}px ${spacing.xl}px`,
  },
  gutterBottom: {
    paddingBottom: spacing.xxl,
  },
  gutterTop: {
    paddingTop: spacing.sm,
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: `${spacing.md}px ${spacing.md}px ${spacing.xl}px`,
  },
}))
