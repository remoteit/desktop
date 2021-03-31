import React from 'react'
import { evaluationDays } from '../models/licensing'
import { makeStyles, LinearProgress, Typography, Box } from '@material-ui/core'
import { colors, spacing } from '../styling'

export const LimitSetting: React.FC<{ limit: ILimit }> = ({ limit }) => {
  const css = useStyles()
  const v = (value?: number): number => value || 0

  let template: 'value' | 'text' | undefined
  let message: React.ReactElement | string | undefined

  switch (limit.name) {
    case 'aws-services':
      template = 'value'
      message =
        limit.value !== null ? `${v(limit.actual)} of ${v(limit.value)} services registered` : 'Unlimited services'
      break
    case 'aws-evaluation':
      template = 'text'
      message = `Services are granted a ${evaluationDays(limit.value)} day evaluation period`
      break
    case 'log-limit':
      template = 'text'
      message = `Log history is available for ${evaluationDays(limit.value)} days`
      break
    case 'iot-devices':
      template = 'value'
      message =
        limit.value !== null
          ? `${v(limit.actual)} of ${v(limit.value)} licensed devices registered`
          : 'Unlimited devices'
      break
    case 'iot-nc-devices':
      template = 'value'
      message =
        limit.value !== null
          ? `${v(limit.actual)} of ${v(limit.value)} non-commercial devices registered`
          : 'Unlimited non-commercial devices'
      break
  }

  // Templates
  switch (template) {
    case 'text':
      return <Typography variant="caption">{message}</Typography>
    case 'value':
      return (
        <Box className={css.box}>
          <Typography variant="caption" display="block">
            {message}
          </Typography>
          <LinearProgress
            classes={{ root: css.root, colorPrimary: css.colorPrimary, bar: css.bar }}
            variant="determinate"
            value={limit.value ? (limit.actual / limit.value) * 100 : 0}
          />
        </Box>
      )
    default:
      return null
  }
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
