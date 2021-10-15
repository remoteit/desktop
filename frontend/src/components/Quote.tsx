import React from 'react'
import { colors, spacing } from '../styling'
import { makeStyles, Box } from '@material-ui/core'

type Props = { margin?: number; noInset?: boolean }

export const Quote: React.FC<Props> = ({ margin = spacing.lg, noInset, children }) => {
  const css = useStyles({ margin, noInset })
  return <Box className={css.quote}>{children}</Box>
}

const useStyles = makeStyles({
  quote: ({ margin, noInset }: Props) => ({
    width: '100%',
    margin: `${margin}px 0`,
    paddingLeft: noInset ? undefined : spacing.lg,
    borderLeft: `1px solid ${colors.grayLighter}`,
    // '& .MuiListItem-root, & > .MuiIconButton-root': {
    //   marginLeft: -spacing.md,
    // },
  }),
})
