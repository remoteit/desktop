import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'
import { spacing } from '../styling'

export const Gutters: React.FC<{ inset?: boolean; noBottom?: boolean; className?: string }> = ({
  inset,
  className,
  noBottom,
  children,
  ...props
}) => {
  const css = useStyles(inset, noBottom)()
  return (
    <div className={classnames(css.gutters, className)} {...props}>
      {children}
    </div>
  )
}

const useStyles = (inset, noBottom) =>
  makeStyles({
    gutters: {
      margin: inset
        ? `${spacing.md}px ${spacing.xxl}px ${noBottom ? 0 : spacing.lg}px`
        : `${spacing.md}px ${spacing.xl}px ${noBottom ? 0 : spacing.lg}px`,
      paddingLeft: inset ? spacing.sm : 0,
    },
  })
