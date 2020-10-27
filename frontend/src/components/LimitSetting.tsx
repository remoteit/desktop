import React from 'react'
import { evaluationDays } from '../models/licensing'
import { makeStyles, LinearProgress, Typography } from '@material-ui/core'
import { colors, spacing } from '../styling'

export const LimitSetting: React.FC<{ limit: ILimit }> = ({ limit }) => {
  const css = useStyles()
  let Limit

  switch (limit.name) {
    case 'aws-services':
      Limit = limit.value ? (
        <>
          <Typography variant="caption">
            {limit.actual} of {limit.value} services registered
          </Typography>
          <LinearProgress
            classes={css}
            variant="determinate"
            value={(limit.actual / limit.value) * 100}
            style={{ width: '100%' }}
          />
        </>
      ) : (
        <>
          <Typography variant="caption">Unlimited services</Typography>
          <LinearProgress classes={css} variant="determinate" value={0} />
        </>
      )
      break
    case 'aws-evaluation':
      Limit = (
        <Typography variant="caption">
          Services are granted a {evaluationDays(limit.value)} day evaluation period
        </Typography>
      )
      break
  }

  return Limit ? Limit : null
}

const useStyles = makeStyles({
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
