import React from 'react'
import { humanizeDays } from '../models/licensing'
import { makeStyles, LinearProgress, Typography, Box } from '@material-ui/core'
import { spacing } from '../styling'

export const LimitSetting: React.FC<{ limit: ILimit }> = ({ limit }) => {
  const css = useStyles()
  const v = (value?: number): string => (value || 0).toLocaleString()
  const overLimit = limit.value !== null && limit.actual > limit.value ? limit.actual - limit.value : 0

  let template: 'value' | 'text' | undefined
  let message: React.ReactElement | string | undefined

  if (limit.value === 0 && limit.actual === 0) return null

  switch (limit.name) {
    case 'org-users':
      template = 'value'
      message = limit.value !== null ? `${v(limit.actual)} of ${v(limit.value)} user licenses used` : undefined
      break
    case 'saml':
      template = 'text'
      message = limit.value ? 'SAML available' : 'SAML unavailable'
      break
    case 'roles':
      template = 'text'
      message = limit.value ? 'Custom roles available' : 'Custom roles unavailable'
      break
    case 'tagging':
      // hidden
      // template = 'text'
      // message = limit.value ? 'Tagging active' : 'Tagging unavailable'
      break
    case 'aws-services':
      template = 'value'
      message =
        limit.value !== null ? `${v(limit.actual)} of ${v(limit.value)} services registered` : 'Unlimited services'
      break
    case 'aws-evaluation':
      template = 'text'
      message = `Services are granted an evaluation period of ${humanizeDays(limit.value)}`
      break
    case 'log-limit':
      template = 'text'
      message = `Log history is available for ${humanizeDays(limit.value)}`
      break
    case 'iot-devices':
      template = 'value'
      message = limit.value === null ? 'Unlimited devices' : `${v(limit.actual)} of ${v(limit.value)} licensed devices`
      if (overLimit)
        message = `You are ${v(overLimit)} device${overLimit > 1 ? 's' : ''} over your ${v(limit.value)} device limit`
      break
    case 'iot-nc-devices':
      template = 'value'
      message =
        limit.value === null
          ? 'Unlimited non-commercial devices'
          : `${v(limit.actual)} of ${v(limit.value)} non-commercial devices`
      if (overLimit)
        message = `You are ${v(overLimit)} device${overLimit > 1 ? 's' : ''} over your ${v(
          limit.value
        )} device non-commercial limit`
      break
  }

  // Templates
  switch (template) {
    case 'text':
      return (
        <Typography variant="caption" component="div">
          {message}
        </Typography>
      )
    case 'value':
      let value = limit.value ? (limit.actual / limit.value) * 100 : 0
      if (value > 100) value = (100 / value) * 100
      return (
        <Box className={css.box}>
          <Typography variant="caption" display="block">
            {message}
          </Typography>
          <LinearProgress
            classes={{
              root: css.root,
              colorPrimary: overLimit ? css.warning : css.background,
              bar: overLimit ? css.warningBar : undefined,
            }}
            variant="determinate"
            value={value}
          />
        </Box>
      )
    default:
      return null
  }
}

const useStyles = makeStyles(({ palette }) => ({
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
  background: {
    backgroundColor: palette.grayLighter.main,
  },
  warning: {
    backgroundColor: palette.warning.main,
  },
  warningBar: {
    backgroundColor: palette.primary.main,
  },
}))
