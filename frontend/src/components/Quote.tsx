import React from 'react'
import { spacing, Spacing } from '../styling'
import { makeStyles, Box } from '@material-ui/core'

type Props = { margin?: Spacing | null; listItem?: boolean; noInset?: boolean }

export const Quote: React.FC<Props> = ({ margin = 'lg', listItem, noInset, children }) => {
  const css = useStyles({ margin, noInset, listItem })
  return <Box className={css.quote}>{children}</Box>
}

const useStyles = makeStyles(({ palette }) => ({
  quote: ({ margin, noInset, listItem }: Props) => {
    const marginLeft = listItem ? 27 : undefined
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
