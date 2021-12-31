import React from 'react'
import { colors, spacing } from '../styling'
import { makeStyles, Box } from '@material-ui/core'

type Props = { margin?: number; listItem?: boolean; noInset?: boolean, paddingLeft?: number }

export const Quote: React.FC<Props> = ({ margin = spacing.lg, listItem, noInset, children, paddingLeft = undefined }) => {
  const css = useStyles({ margin, noInset, listItem })
  return <Box className={css.quote}>{children}</Box>
}

const useStyles = makeStyles({
  quote: ({ margin, noInset, listItem, paddingLeft }: Props) => {
    const marginLeft = listItem ? 27 : undefined
    return {
      width: `calc(100% - ${marginLeft}px)`,
      position: 'relative',
      margin: `${margin}px 0`,
      paddingLeft: noInset ? undefined : paddingLeft ? `${paddingLeft}px` : spacing.lg,
      borderLeft: `1px solid ${colors.grayLighter}`,
      marginLeft,
    }
  },
})
