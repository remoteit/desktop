import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, Popover, Typography, LinearProgress } from '@mui/material'
import { State } from '../../store'
import { formatReset } from '../../models/chat'
import { UsageWindow } from '../../services/agent'
import { IconButton } from '../../buttons/IconButton'
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

/* The header usage affordance (docs/usage-limits.md D6): quiet until it matters. A gauge
   icon that tints as the tighter window fills; clicking opens both windows' meters. Hidden
   entirely when both windows are unlimited (nothing to show). */
export const ChatUsage: React.FC = () => {
  const { t } = useTranslation()
  const usage = useSelector((state: State) => state.chat.usage)
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null)

  if (!usage || (usage.session.unlimited && usage.weekly.unlimited)) return null

  const worst = Math.max(pct(usage.session), pct(usage.weekly))
  const color = worst >= 90 ? 'error' : worst >= 70 ? 'warning' : 'grayDarker'

  return (
    <>
      <IconButton icon="gauge" title={t('chat.usage', 'Usage')} color={color} onClick={e => setAnchorEl(e.currentTarget)} />
      <Popover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
