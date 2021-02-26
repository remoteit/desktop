import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { spacing } from '../styling'

export const Gutters: React.FC<{ inset?: boolean }> = ({ inset, children, ...props }) => {
  const css = useStyles()
  return (
    <div className={css.gutters} {...props}>
      {children}
    </div>
  )
}

const useStyles = makeStyles({
  gutters: { margin: `${spacing.md}px ${spacing.sm}px ${spacing.lg}px` },
  center: { alignItems: 'stretch' },
  inset: {},
})
