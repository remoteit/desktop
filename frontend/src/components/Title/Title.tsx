import React from 'react'
import { makeStyles } from '@mui/styles'
import { spacing } from '../../styling'
import classnames from 'classnames'

type Props = { inline?: boolean; enabled?: boolean; offline?: boolean; className?: string; children?: React.ReactNode }

export const Title: React.FC<Props> = ({ children, inline, enabled, offline, className }) => {
  const css = useStyles({ inline, enabled, offline })
  return <span className={classnames(css.title, className)}>{children}</span>
}

const useStyles = makeStyles(({ palette }) => ({
  title: ({ inline, enabled, offline }: any) => ({
    display: 'block',
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    opacity: offline ? 0.4 : undefined,
    marginLeft: inline ? spacing.lg : 0,
    color: enabled ? palette.primary.main : undefined,
    '& sup': {
      lineHeight: 1,
      marginLeft: spacing.xs,
      marginRight: spacing.xxs,
      color: enabled ? palette.primary.main : palette.grayDark.main,
    },
  }),
}))
