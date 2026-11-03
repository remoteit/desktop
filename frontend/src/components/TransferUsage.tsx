import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, LinearProgress, List, ListItem, ListItemIcon, Typography } from '@mui/material'
import { fetchTransferUsage, TransferUsage as Usage, TransferUsageDevice } from '../services/transferUsage'
import { getLocale } from '../helpers/dateHelper'
import { timeOptions } from './Timestamp'
import { spacing } from '../styling'

// Transfer is metered in decimal units, as plans state their allowances.
export const gigabytes = (bytes: number) => {
  const value = bytes / 1e9
  return `${value.toFixed(value < 10 ? 2 : 1).replace(/\.?0+$/, '')} GB`
}

export const megabits = (bitsPerSecond: number) => `${+(bitsPerSecond / 1e6).toFixed(1)}`

const formatDate = (at: string) => new Date(at).toLocaleDateString(getLocale(), timeOptions.short)

const SHOWN_DEVICES = 3

/* The account's public transfer this month (services/transferUsage), under its file storage on the License pages: a
   bar each for public exit and public proxy against the plan's allowance, and which devices sent the exit transfer.
   Nothing where the API has no usage to show; a quiet line where it could not be read. */
export const TransferUsage: React.FC<{ accountId?: string }> = ({ accountId }) => {
  const { t } = useTranslation()
  const [usage, setUsage] = useState<Usage[] | 'ERROR' | null>()

  useEffect(() => {
    let current = true
    fetchTransferUsage(accountId)
      .catch(() => 'ERROR' as const)
      .then(result => {
        if (current) setUsage(result === 'ERROR' || Array.isArray(result) ? result : null)
      })
    return () => {
      current = false
    }
  }, [accountId])

  if (!usage || (Array.isArray(usage) && !usage.length)) return null

  const labels: ILookup<string> = {
    exit: t('transferUsage.exit', 'Public exit transfer'),
    proxy: t('transferUsage.proxy', 'Public proxy transfer'),
  }
  const rows = Array.isArray(usage) ? usage.filter(row => labels[row.kind]) : []

  return (
    <List sx={{ maxWidth: 500 }} disablePadding>
      <ListItem>
        <ListItemIcon />
        <Box data-testid="transfer-usage" width="100%" maxWidth={500} marginBottom={3}>
          <Typography variant="caption" component="p">
            <b>{t('transferUsage.title', 'Usage this month')}</b>
          </Typography>
          {usage === 'ERROR' ? (
            <Typography variant="caption" component="p" color="grayDark.main">
              {t('transferUsage.error', 'Usage could not be read right now.')}
            </Typography>
          ) : (
            <>
              {rows.map(row => (
                <TransferRow key={row.kind} usage={row} label={labels[row.kind]} />
              ))}
              {rows[0] && (
                <Typography variant="caption" component="p" color="grayDark.main" marginTop={1}>
                  {t('transferUsage.resets', 'Resets {{date}}', { date: formatDate(rows[0].resetsAt) })}
                </Typography>
              )}
            </>
          )}
        </Box>
      </ListItem>
    </List>
  )
}

const TransferRow: React.FC<{ usage: Usage; label: string }> = ({ usage, label }) => {
  const { t } = useTranslation()
  const allowance = usage.allowanceBytes
  const percent = allowance ? Math.min(100, (usage.usedBytes / allowance) * 100) : 0
  const color = usage.over ? 'warning' : 'primary'

  return (
    <Box data-testid={`transfer-usage-${usage.kind}`} marginTop={1}>
      <Typography variant="caption" component="p">
        <b>{label}: </b>
        {allowance
          ? t('transferUsage.used', '{{used}} of {{allowance}} used', {
              used: gigabytes(usage.usedBytes),
              allowance: gigabytes(allowance),
            })
          : t('transferUsage.noLimit', '{{used}} used, no limit', { used: gigabytes(usage.usedBytes) })}
      </Typography>
      {!!allowance && (
        <LinearProgress
          variant="determinate"
          value={percent}
          color={color}
          sx={theme => ({
            height: `${spacing.xs}px`,
            borderRadius: `${spacing.xxs}px`,
            marginTop: `${spacing.xxs}px`,
            backgroundColor: theme.palette.grayLighter.main,
          })}
        />
      )}
      {usage.over && (
        <Typography variant="caption" component="p" color="warning.main" marginTop={0.5}>
          {usage.rateBps
            ? t('transferUsage.slowed', 'Slowed to {{rate}} Mbit/s until {{date}}', {
                rate: megabits(usage.rateBps),
                date: formatDate(usage.resetsAt),
              })
            : t('transferUsage.slowedUntil', 'Slowed until {{date}}', { date: formatDate(usage.resetsAt) })}
        </Typography>
      )}
      {usage.kind === 'exit' && <DeviceBreakdown devices={usage.devices} />}
    </Box>
  )
}

// The few devices that sent the most, and the rest as one line.
const DeviceBreakdown: React.FC<{ devices: TransferUsageDevice[] }> = ({ devices }) => {
  const { t } = useTranslation()
  const sorted = [...devices].filter(device => device.usedBytes > 0).sort((a, b) => b.usedBytes - a.usedBytes)
  if (!sorted.length) return null
  const shown = sorted.length > SHOWN_DEVICES + 1 ? sorted.slice(0, SHOWN_DEVICES) : sorted
  const rest = sorted.slice(shown.length)
  const line = (key: string, name: string, bytes: number) => (
    <Box key={key} display="flex" justifyContent="space-between" gap={2}>
      <Typography variant="caption" color="grayDarker.main" noWrap>
        {name}
      </Typography>
      <Typography variant="caption" color="grayDarker.main" flexShrink={0}>
        {gigabytes(bytes)}
      </Typography>
    </Box>
  )

  return (
    <Box data-testid="transfer-usage-devices" marginTop={0.5} paddingLeft={1}>
      {shown.map(device => line(device.deviceId, device.name || device.deviceId, device.usedBytes))}
      {!!rest.length &&
        line(
          'rest',
          t('transferUsage.otherDevices', {
            count: rest.length,
            defaultValue_one: '{{count}} other device',
            defaultValue_other: '{{count}} other devices',
          }),
          rest.reduce((sum, device) => sum + device.usedBytes, 0)
        )}
    </Box>
  )
}
