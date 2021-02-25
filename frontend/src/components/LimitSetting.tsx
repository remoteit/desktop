import React from 'react'
import { evaluationDays } from '../models/licensing'
import { makeStyles, LinearProgress, Typography, Box } from '@material-ui/core'
import { colors, spacing } from '../styling'

export const LimitSetting: React.FC<{ limit: ILimit }> = ({ limit }) => {
  const css = useStyles()
  let Limit

  switch (limit.name) {
    case 'aws-services':
      Limit = limit.value ? (
        <Box className={css.box}>
          <Typography variant="caption" display="block">
            {limit.actual} of {limit.value} services registered
          </Typography>
          <LinearProgress
            classes={{ root: css.root, colorPrimary: css.colorPrimary, bar: css.bar }}
            variant="determinate"
            value={(limit.actual / limit.value) * 100}
          />
        </Box>
      ) : (
        <Box className={css.box}>
          <Typography variant="caption" display="block">
            Unlimited services
          </Typography>
          <LinearProgress
            classes={{ root: css.root, colorPrimary: css.colorPrimary, bar: css.bar }}
            variant="determinate"
            value={0}
          />
        </Box>
      )
      break
    case 'aws-evaluation':
      Limit = (
        <Typography variant="caption">
          Services are granted a {evaluationDays(limit.value)} day evaluation period
        </Typography>
      )
      break
    case 'log-limit':
      Limit = (
        <Typography variant="caption">Log history is available for {evaluationDays(limit.value)} days.</Typography>
      )
  }

  return Limit ? Limit : null
}

const useStyles = makeStyles({
  box: {
    width: '70%',
    marginBottom: spacing.sm,
  },
  root: {
    height: spacing.xs,
    borderRadius: spacing.xxs,
    width: '100%',
    marginTop: spacing.xxs,
  },
  colorPrimary: {
    backgroundColor: colors.grayLighter,
  },
  bar: {
    borderRadius: spacing.xxs,
  },
})
