import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { spacing } from '../styling'

export const Gutters: React.FC<{ inset?: boolean; className?: string }> = ({ inset, children, ...props }) => {
  const css = useStyles(inset)()
  return (
    <div className={css.gutters} {...props}>
      {children}
    </div>
  )
}

const useStyles = inset =>
  makeStyles({
    gutters: {
      margin: inset
        ? `${spacing.md}px ${spacing.lg}px ${spacing.lg}px`
        : `${spacing.md}px ${spacing.sm}px ${spacing.lg}px`,
    },
    center: { alignItems: 'stretch' },
    inset: {},
  })
