import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

export const Columns: React.FC<{ count?: 1 | 2; inset?: boolean }> = ({ count, inset, ...props }) => {
  const css = useStyles()
  let classes = css.columns
  if (count !== 1) classes += ' ' + css.two
  if (inset) classes += ' ' + css.inset
  return <div className={classes} {...props}></div>
}

const useStyles = makeStyles({
  columns: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
  },
  inset: { margin: `${spacing.md}px  ${spacing.sm}px ${spacing.lg}px 70px` },
  two: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    '& > *:first-child': { flexGrow: 1 },
    '& > *:last-child': {
      paddingRight: spacing.xl,
      paddingLeft: spacing.sm,
    },
  },
})
