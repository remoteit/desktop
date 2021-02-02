import React, { useState } from 'react'
import classnames from 'classnames'
import { spacing, colors } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'

type Props = {
  inset?: boolean
  center?: boolean
  flex?: boolean
  className?: string
  maxHeight?: string
}

export const Body: React.FC<Props> = ({ inset, center, flex, maxHeight, className = '', children }) => {
  const css = useStyles()
  const [hover, setHover] = useState<boolean>(true)
  className = classnames(
    className,
    css.body,
    flex && css.flex,
    center && css.center,
    inset && css.inset,
    hover && css.showScroll
  )
  let style = maxHeight ? { maxHeight } : {}
  return (
    <div className={className} style={style} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {children}
    </div>
  )
}

const useStyles = makeStyles({
  body: {
    overflowY: 'auto',
    flexGrow: 1,
    position: 'relative',
    '-webkit-overflow-scrolling': 'touch',
    '& section': { padding: spacing.xl },
    '&::-webkit-scrollbar': { '-webkit-appearance': 'none' },
    '&::-webkit-scrollbar:vertical': { width: 11 },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: 8,
      border: `2px solid ${colors.white}`, // should match background, can't be transparent
      backgroundColor: colors.white,
    },
  },
  inset: {
    padding: `${spacing.sm}px ${spacing.xl}px`,
  },
  flex: {
    display: 'flex',
    alignContent: 'flex-start',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    height: '100%',
    padding: `${spacing.md}px ${spacing.md}px`,
  },
  hideScroll: {
    '&::-webkit-scrollbar': { display: 'none' },
  },
  showScroll: {
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: `${colors.darken} !important`,
    },
  },
})
