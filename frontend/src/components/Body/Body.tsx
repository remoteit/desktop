import React from 'react'
import { spacing } from '../../styling'
import { makeStyles } from '@material-ui/styles'

export const Body: React.FC<{ inset?: boolean; center?: boolean; className?: string }> = ({
  inset,
  center,
  className = '',
  children,
}) => {
  const css = useStyles()
  className += (className ? ' ' : '') + css.body
  if (center) className += ' ' + css.center
  if (inset) className += ' ' + css.inset
  return <div className={className}>{children}</div>
}

const useStyles = makeStyles({
  body: {
    overflowY: 'auto',
    flexGrow: 1,
    position: 'relative',
    '-webkit-overflow-scrolling': 'touch',
    '&::-webkit-scrollbar': { display: 'none' },
    '& section': {
      padding: `${spacing.xl}px`,
    },
  },
  inset: {
    padding: `${spacing.sm}px ${spacing.xl}px`,
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    height: '100%',
    padding: `${spacing.md}px ${spacing.md}px`,
  },
})
