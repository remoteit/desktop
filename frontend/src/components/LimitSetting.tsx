import React from 'react'
import { humanizeDays } from '../models/plans'
import { LinearProgress, Typography, Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { spacing } from '../styling'

export const LimitSetting: React.FC<{ limit: ILimit }> = ({ limit }) => {
  const { t } = useTranslation()
  const v = (value?: number): string => (value || 0).toLocaleString()
  const overLimit = limit.value !== null && limit.actual > limit.value ? limit.actual - limit.value : 0

  let template: 'value' | 'text' | undefined
  let message: React.ReactNode | undefined

  if (limit.value === 0 && limit.actual === 0) return null

  switch (limit.name) {
    case 'org-users':
      template = 'value'
      message =
        limit.value !== null
          ? t('limitSetting.userLicenses', {
              actual: v(limit.actual),
              value: v(limit.value),
              defaultValue: '{{actual}} of {{value}} user licenses used',
            })
          : undefined
      break
    case 'saml':
      template = 'text'
      message = limit.value
        ? t('limitSetting.samlAvailable', 'SAML login is available')
        : t('limitSetting.samlUnavailable', 'SAML login is unavailable')
      break
    case 'roles':
      template = 'text'
      message = limit.value
        ? t('limitSetting.rolesAvailable', 'Custom roles are available')
        : t('limitSetting.rolesUnavailable', 'Custom roles are unavailable')
      break
    case 'tagging':
      // ignore
      break
    case 'no-splash':
      template = 'text'
      message = limit.value
        ? t('limitSetting.noSplash', 'No splash screen displayed on persistent web pages')
        : t('limitSetting.splash', 'Persistent web pages will display a splash screen')
      break
    case 'aws-services':
      template = 'value'
      message =
        limit.value !== null
          ? t('limitSetting.servicesRegistered', {
              actual: v(limit.actual),
              value: v(limit.value),
              defaultValue: '{{actual}} of {{value}} services registered',
            })
          : t('limitSetting.unlimitedServices', 'Unlimited services')
      break
    case 'aws-evaluation':
      template = 'text'
      message = t('limitSetting.evaluationPeriod', {
        period: humanizeDays(limit.value),
        defaultValue: 'Services are granted an evaluation period of {{period}}',
      })
      break
    case 'support':
      template = 'text'
      message =
        limit.value > 10
          ? t('limitSetting.emailSupport', 'Email support available')
          : t('limitSetting.forumSupport', 'Forum support only')
      break
    case 'log-limit':
      template = 'text'
      message = t('limitSetting.logHistory', {
        period: humanizeDays(limit.value),
        defaultValue: 'Log history is available for {{period}}',
      })
      break
    case 'iot-devices':
      template = 'value'
      message =
        limit.value === null
          ? t('limitSetting.unlimitedDevices', 'Unlimited devices')
          : t('limitSetting.licensedDevices', {
              actual: v(limit.actual),
              value: v(limit.value),
              defaultValue: '{{actual}} of {{value}} licensed devices',
            })
      if (overLimit)
        message = t('limitSetting.overLimit', {
          count: overLimit,
          over: v(overLimit),
          value: v(limit.value),
          defaultValue_one: 'You are {{over}} device over your {{value}} device limit',
          defaultValue_other: 'You are {{over}} devices over your {{value}} device limit',
        })
      break
    case 'trial-devices':
      // ignore
      break
    case 'iot-nc-devices':
      template = 'value'
      message =
        limit.value === null
          ? t('limitSetting.unlimitedNonCommercial', 'Unlimited non-commercial devices')
          : t('limitSetting.nonCommercialDevices', {
              actual: v(limit.actual),
              value: v(limit.value),
              defaultValue: '{{actual}} of {{value}} non-commercial devices',
            })
      if (overLimit)
        message = t('limitSetting.overLimitNonCommercial', {
          count: overLimit,
          over: v(overLimit),
          value: v(limit.value),
          defaultValue_one: 'You are {{over}} device over your {{value}} device non-commercial limit',
          defaultValue_other: 'You are {{over}} devices over your {{value}} device non-commercial limit',
        })
      break
  }

  // Templates
  switch (template) {
    case 'text':
      return (
        <Typography variant="caption" marginBottom={0.5} component="p">
          {message}
        </Typography>
      )
    case 'value':
      let value = limit.value ? (limit.actual / limit.value) * 100 : 0
      if (value > 100) value = (100 / value) * 100
      return (
        <Box marginBottom={3}>
          <Typography variant="caption">{message}</Typography>
          <LinearProgress
            sx={theme => ({
              height: `${spacing.xs}px`,
              borderRadius: `${spacing.xxs}px`,
              width: '100%',
              marginTop: `${spacing.xxs}px`,
              backgroundColor: overLimit ? theme.palette.warning.main : theme.palette.grayLighter.main,
              '& .MuiLinearProgress-bar': overLimit ? { backgroundColor: theme.palette.primary.main } : {},
            })}
            variant="determinate"
            value={value}
          />
        </Box>
      )
    default:
      return null
  }
}
