import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'
import { spacing } from '../styling'

export const Gutters: React.FC<{ inset?: boolean; className?: string }> = ({
  inset,
  className,
  children,
  ...props
}) => {
  const css = useStyles(inset)()
  return (
    <div className={classnames(css.gutters, className)} {...props}>
      {children}
    </div>
  )
}

const useStyles = inset =>
  makeStyles({
    gutters: {
      margin: inset
        ? `${spacing.md}px ${spacing.xxl}px ${spacing.lg}px`
        : `${spacing.md}px ${spacing.md}px ${spacing.lg}px`,
      paddingLeft: inset ? spacing.sm : 0,
    },
  })
