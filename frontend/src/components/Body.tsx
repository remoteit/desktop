import React, { useState } from 'react'
import classnames from 'classnames'
import { spacing, Color } from '../styling'
import { makeStyles } from '@material-ui/core/styles'

export type BodyProps = {
  inset?: boolean
  center?: boolean
  flex?: boolean
  bodyRef?: React.RefObject<HTMLDivElement>
  className?: string
  maxHeight?: string
  gutterBottom?: boolean
  gutterTop?: boolean
  insetShadow?: boolean
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
  insetShadow = true,
  scrollbarBackground,
  children,
}) => {
  const css = useStyles({ scrollbarBackground })
  const [hover, setHover] = useState<boolean>(true)
  className = classnames(
    className,
    css.body,
    flex && css.flex,
    center && css.center,
    inset && css.inset,
    hover && css.showScroll,
    gutterBottom && css.gutterBottom,
    gutterTop && css.gutterTop,
    insetShadow && css.insetShadow
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
  body: ({ scrollbarBackground }: BodyProps) => {
    const background = scrollbarBackground ? palette[scrollbarBackground].main : palette.white.main
    return {
      flexGrow: 1,
      height: '100%',
      overflow: 'auto',
      position: 'relative',
      '-webkit-overflow-scrolling': 'touch',
      '& section': { padding: spacing.xl },
      '&::-webkit-scrollbar': { '-webkit-appearance': 'none' },
      '&::-webkit-scrollbar:vertical': { width: 11 },
      '&::-webkit-scrollbar:horizontal': { height: 11 },
      '&::-webkit-scrollbar-corner': { background },
      '&::-webkit-scrollbar-thumb': {
        borderRadius: 8,
        border: `2px solid ${background}`, // should match background, can't be transparent
        backgroundColor: background,
      },
    }
  },
  insetShadow: {
    '&::after': {
      content: '""',
      position: 'fixed',
      height: 30,
      width: '100%',
      zIndex: 1000,
      bottom: 0,
      boxShadow: `inset 0px -20px 20px -15px ${palette.white.main}`,
    },
  },
  inset: {
    padding: `${spacing.sm}px ${spacing.xl}px`,
  },
  flex: {
    display: 'flex',
    alignContent: 'flex-start',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
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
  hideScroll: {
    '&::-webkit-scrollbar': { display: 'none' },
  },
  showScroll: {
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: `${palette.grayLight.main} !important`,
    },
  },
}))
