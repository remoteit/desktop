import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

export const Columns: React.FC<{ count?: 1 | 2; margin?: boolean }> = props => {
  const css = useStyles()
  let classes = css.columns
  if (props.count !== 1) classes += ' ' + css.two
  if (props.margin) classes += ' ' + css.margin
  return <div className={classes} {...props}></div>
}

const useStyles = makeStyles({
  columns: {
    display: 'flex',
    flexDirection: 'column',
  },
  margin: { margin: `${spacing.md}px  ${spacing.sm}px ${spacing.lg}px 70px` },
  two: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    '& > *:first-child': { flexGrow: 1 },
  },
})
