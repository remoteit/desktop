import React from 'react'
import { Icon } from './Icon'
import { spacing, colors } from '../styling'
import { makeStyles, Paper } from '@material-ui/core'

type Props = {}

export const Notice: React.FC<Props> = ({ children }) => {
  const css = useStyles()

  return (
    <Paper elevation={0} className={css.notice}>
      <Icon name="info-circle" size="md" inlineLeft />
      {children}
    </Paper>
  )
}

const useStyles = makeStyles({
  notice: {
    padding: `${spacing.sm}px ${spacing.md}px`,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryHighlight,
    color: colors.primary,
    '& i': { fontStyle: 'normal' },
    '& b': { fontWeight: 'inherit', color: colors.grayDarkest },
  },
})
