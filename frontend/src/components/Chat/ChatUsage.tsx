import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, Popover, Typography, LinearProgress, CircularProgress, IconButton as MuiIconButton } from '@mui/material'
import { State } from '../../store'
import { formatReset } from '../../models/chat'
import { UsageWindow } from '../../services/agent'
import { Icon } from '../Icon'

const pct = (w: UsageWindow) => (w.unlimited || w.limitUsd <= 0 ? 0 : Math.min(100, Math.round((w.spentUsd / w.limitUsd) * 100)))

/* One window's row in the popover: a labeled bar + reset time. */
const WindowRow: React.FC<{ label: string; window: UsageWindow }> = ({ label, window }) => {
  const { t } = useTranslation()
  const used = pct(window)
  const color = used >= 90 ? 'error' : used >= 70 ? 'warning' : 'primary'
  return (
    <Box sx={{ marginY: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="caption" color="grayDarkest.main">
          {label}
        </Typography>
        <Typography variant="caption" color="grayDark.main">
          {window.unlimited ? t('chat.usageUnlimited', 'No limit') : `${used}%`}
        </Typography>
      </Box>
      {!window.unlimited && (
        <>
          <LinearProgress variant="determinate" value={used} color={color} sx={{ borderRadius: 1, height: 6, marginY: 0.5 }} />
          {window.resetsAt && (
            <Typography variant="caption" color="grayDark.main">
              {t('chat.usageResets', 'Resets {{when}}', { when: formatReset(window.resetsAt) })}
            </Typography>
          )}
        </>
      )}
    </Box>
  )
}

/* A ring: a full-circle track with the used arc drawn over it. Two stacked determinate
   progress circles is the MUI idiom for a donut — there is no dedicated gauge. */
const UsageRing: React.FC<{ value: number; color: 'primary' | 'warning' | 'error' }> = ({ value, color }) => (
  <Box sx={{ display: 'inline-flex', position: 'relative' }}>
    <CircularProgress variant="determinate" value={100} size={18} thickness={6} sx={{ color: 'grayLighter.main' }} />
    <CircularProgress
      variant="determinate"
      value={value}
      size={18}
      thickness={6}
      color={color}
      sx={{ position: 'absolute', left: 0 }}
    />
  </Box>
)

/* The usage affordance (docs/usage-limits.md D6): quiet until it matters. Sits under the
   composer rather than in the header — it reports on what you are about to spend, so it
   belongs with the send box. The ring fills as the tighter of the two windows does;
   clicking opens both meters. Hidden entirely when both are unlimited. */
export const ChatUsage: React.FC = () => {
  const { t } = useTranslation()
  const usage = useSelector((state: State) => state.chat.usage)
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null)

  if (!usage || (usage.session.unlimited && usage.weekly.unlimited)) return null

  const worst = Math.max(pct(usage.session), pct(usage.weekly))
  const color = worst >= 90 ? 'error' : worst >= 70 ? 'warning' : 'primary'

  return (
    <>
      <MuiIconButton
        size="small"
        title={t('chat.usage', 'Usage')}
        onClick={e => setAnchorEl(e.currentTarget)}
        sx={{ padding: 0.5 }}
      >
        <UsageRing value={worst} color={color} />
      </MuiIconButton>
      <Popover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 260, padding: 2 } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
          <Icon name="gauge" size="sm" color="grayDarker" />
          <Typography variant="subtitle2">{t('chat.usageTitle', 'Usage')}</Typography>
        </Box>
        <WindowRow label={t('chat.usageSession', '5-hour session')} window={usage.session} />
        <WindowRow label={t('chat.usageWeekly', 'This week')} window={usage.weekly} />
      </Popover>
    </>
  )
}
