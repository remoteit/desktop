import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

export const Columns: React.FC<{ count?: 1 | 2 }> = props => {
  const css = useStyles(props)
  let classes = css.columns
  if (props.count !== 1) classes += ' ' + css.two
  return <div className={classes} {...props}></div>
}

const useStyles = makeStyles({
  columns: {
    display: 'flex',
    flexDirection: 'column',
    margin: `${spacing.md}px  ${spacing.sm}px ${spacing.lg}px 70px`,
  },
  two: {
    flexDirection: 'row',
    '& > *': { width: '50%' },
  },
})
