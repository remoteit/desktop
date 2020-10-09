import React from 'react'
import { Icon } from './Icon'
import { spacing, colors } from '../styling'
import { makeStyles, Paper, Box } from '@material-ui/core'
import classnames from 'classnames'

type Props = {
  gutterBottom?: boolean
}

export const Notice: React.FC<Props> = ({ gutterBottom, children }) => {
  const css = useStyles()

  return (
    <Paper elevation={0} className={classnames(css.notice, gutterBottom && css.gutter)}>
      <Icon name="info-circle" size="md" inlineLeft />
      <Box>{children}</Box>
    </Paper>
  )
}

const useStyles = makeStyles({
  notice: {
    flexGrow: 1,
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.primaryHighlight,
    color: colors.primary,
    display: 'flex',
    '& span': { marginTop: spacing.xxs },
    '& b': { fontWeight: 'inherit', color: colors.grayDarkest },
  },
  gutter: {
    marginBottom: spacing.md,
  },
})
