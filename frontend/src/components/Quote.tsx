import React from 'react'
import classnames from 'classnames'
import { spacing, Spacing } from '../styling'
import { makeStyles } from '@mui/styles'
import { Box } from '@mui/material'

type Props = {
  margin?: Spacing | null
  indent?: 'listItem' | 'checkbox'
  noInset?: boolean
  className?: string
  children?: React.ReactNode
}

export const Quote: React.FC<Props> = ({ margin = 'lg', indent, noInset, className, children }) => {
  const css = useStyles({ margin, noInset, indent })
  return <Box className={classnames(css.quote, className)}>{children}</Box>
}

const useStyles = makeStyles(({ palette }) => ({
  quote: ({ margin, noInset, indent }: Props) => {
    let marginLeft
    if (indent === 'listItem') marginLeft = 27
    if (indent === 'checkbox') marginLeft = 14
    return {
      width: `calc(100% - ${marginLeft}px)`,
      position: 'relative',
      marginTop: margin ? spacing[margin] : undefined,
      marginBottom: margin ? spacing[margin] : undefined,
      paddingLeft: noInset ? undefined : spacing.lg,
      borderLeft: `1px solid ${palette.grayLighter.main}`,
      marginLeft,
    }
  },
}))
