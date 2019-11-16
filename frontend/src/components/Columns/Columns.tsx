import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

export const Columns: React.FC = props => {
  const css = useStyles()
  return <div className={css.columns} {...props}></div>
}

const useStyles = makeStyles({
  columns: {
    display: 'flex',
    flexDirection: 'row',
    margin: `${spacing.md}px  ${spacing.sm}px ${spacing.lg}px 70px`,
    '& > *': { width: '50%' },
  },
})
