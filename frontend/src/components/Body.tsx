import React, { useState } from 'react'
import classnames from 'classnames'
import { spacing, Color } from '../styling'
import { makeStyles } from '@material-ui/core/styles'

const SCROLLBAR_WIDTH = 15

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
  const css = useStyles({ scrollbarBackground, horizontalOverflow, verticalOverflow })
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
    <div
      ref={bodyRef}
      className={className}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </div>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  body: ({ scrollbarBackground, verticalOverflow, horizontalOverflow }: BodyProps) => {
    const background = scrollbarBackground ? palette[scrollbarBackground].main : palette.white.main
    return {
      flexGrow: 1,
      height: '100%',
      overflow: 'auto',
      position: 'relative',
      '-webkit-overflow-scrolling': 'touch',
      '&::-webkit-scrollbar': { '-webkit-appearance': 'none' },
      '&::-webkit-scrollbar:vertical': { width: SCROLLBAR_WIDTH },
      '&::-webkit-scrollbar:horizontal': { height: SCROLLBAR_WIDTH },
      '&::-webkit-scrollbar-corner': { background },
      '&::-webkit-scrollbar-thumb': {
        borderRadius: 8,
        border: `4px solid ${background}`,
        backgroundColor: `${background}`,
      },
      '& > *:first-child': horizontalOverflow ? { minHeight: '100.1%' } : undefined, // forces right scrollbar to appear (overflow: scroll causes extra padding)
      '&::after': verticalOverflow
        ? {
            content: '""',
            position: 'fixed',
            height: 30,
            zIndex: 7,
            width: '100%',
            right: horizontalOverflow ? SCROLLBAR_WIDTH : undefined,
            bottom: horizontalOverflow ? SCROLLBAR_WIDTH : 0,
            backgroundImage: `linear-gradient(transparent, ${background})`,
            pointerEvents: 'none',
          }
        : undefined,
      '&::before': horizontalOverflow
        ? {
            content: '""',
            position: 'fixed',
            width: 30,
            top: 0,
            bottom: SCROLLBAR_WIDTH,
            zIndex: 7,
            right: SCROLLBAR_WIDTH,
            backgroundImage: `linear-gradient(90deg, transparent, ${background})`,
            pointerEvents: 'none',
          }
        : undefined,
    }
  },
  showScroll: {
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: `${palette.primaryLight.main} !important`,
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
    paddingTop: spacing.md,
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: `${spacing.md}px ${spacing.md}px`,
  },
}))
