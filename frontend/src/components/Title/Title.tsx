import React from 'react'
import { makeStyles } from '@material-ui/core'
import { spacing } from '../../styling'

export const Title: React.FC<{ color?: string }> = ({ children, color }) => {
  const css = useStyles()
  return (
    <span className={css.title} style={{ color }}>
      {children}
    </span>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1, '& sup': { marginLeft: spacing.xs } },
})
