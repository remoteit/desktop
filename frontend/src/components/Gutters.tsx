import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'
import { spacing } from '../styling'

type Props = { inset?: string; noBottom?: boolean; noTop?: boolean; className?: string }

export const Gutters: React.FC<Props> = ({ inset, className, noBottom, noTop, children, ...props }) => {
  const css = useStyles({ inset, noBottom, noTop })
  return (
    <div className={classnames(css.gutters, className)} {...props}>
      {children}
    </div>
  )
}

const useStyles = makeStyles({
  gutters: ({ inset, noBottom, noTop }: Props) => ({
    margin: inset
      ? `${noTop ? 0 : spacing.md}px ${spacing[inset]}px ${noBottom ? 0 : spacing.lg}px`
      : `${noTop ? 0 : spacing.md}px ${spacing.xl}px ${noBottom ? 0 : spacing.lg}px`,
    paddingLeft: inset ? spacing[inset] : 0,
  }),
})
