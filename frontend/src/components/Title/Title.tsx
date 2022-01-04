import React from 'react'
import { makeStyles } from '@material-ui/core'
import { spacing } from '../../styling'
import classnames from 'classnames'

type Props = { offline?: boolean; inline?: boolean; enabled?: boolean; license?: string; className?: string }

export const Title: React.FC<Props> = ({ children, offline, inline, enabled, license, className }) => {
  const unlicensed = license === 'EVALUATION' || license === 'UNLICENSED'
  const css = useStyles({ inline, offline, enabled, unlicensed })
  return <span className={classnames(css.title, className)}>{children}</span>
}

const useStyles = makeStyles( ({ palette }) => ({
  title: ({ inline, offline, enabled, unlicensed }: any) => ({
    display: 'block',
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginLeft: inline ? spacing.lg : 0,
    color: unlicensed ? palette.warning.main : enabled ? palette.primary.main : undefined,
    opacity: offline ? 0.3 : 1,
    '& sup': {
      marginLeft: spacing.xs,
      marginRight: spacing.xxs,
      color: unlicensed ? palette.warning.main : enabled ? palette.primary.main : palette.grayDark.main,
    },
  }),
}))
