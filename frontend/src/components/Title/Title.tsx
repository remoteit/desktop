import React from 'react'
import { makeStyles } from '@mui/styles'
import { spacing } from '../../styling'
import classnames from 'classnames'

type Props = { inline?: boolean; enabled?: boolean; className?: string; children?: React.ReactNode }

export const Title: React.FC<Props> = ({ children, inline, enabled, className }) => {
  const css = useStyles({ inline, enabled })
  return <span className={classnames(css.title, className)}>{children}</span>
}

const useStyles = makeStyles(({ palette }) => ({
  title: ({ inline, enabled, unlicensed }: any) => ({
    display: 'block',
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
