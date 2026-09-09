import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Box,
  Popover,
  Tooltip,
  Typography,
  LinearProgress,
  CircularProgress,
  IconButton as MuiIconButton,
} from '@mui/material'
import { State } from '../../store'
import { formatReset } from '../../models/chat'
import { UsageWindow } from '../../services/agent'
import { radius } from '../../styling'

const pct = (w: UsageWindow) =>
  w.unlimited || w.limitUsd <= 0 ? 0 : Math.min(100, Math.round((w.spentUsd / w.limitUsd) * 100))

/* One window's row in the popover: a labeled bar + reset time. */
const WindowRow: React.FC<{ label: string; window: UsageWindow; gutterBottom?: boolean }> = ({
  label,
  window,
  gutterBottom,
}) => {
  const { t } = useTranslation()
  const used = pct(window)
  const color = used >= 90 ? 'error' : used >= 70 ? 'warning' : 'primary'
  return (
    <Box sx={{ marginBottom: gutterBottom ? 2 : 0 }}>
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
          <LinearProgress
            variant="determinate"
            value={used}
            color={color}
            sx={{ borderRadius: `${radius.sm}px`, height: 6, marginY: 0.5 }}
          />
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
    <CircularProgress variant="determinate" value={100} size={20} thickness={6} sx={{ color: 'grayLight.main' }} />
    <CircularProgress
      variant="determinate"
      value={value}
      size={20}
      thickness={6}
      color={color}
      sx={{ position: 'absolute', left: 0 }}
    />
  </Box>
)

/* The usage affordance (docs/usage-limits.md D6): quiet until it matters. Rides INSIDE
   the composer, between the field and send — it reports on what you are about to spend,
   so it belongs with the send box, and sitting in that row costs no extra height. The
   ring fills as the tighter of the two windows does; clicking opens both meters. Hidden
   entirely when both are unlimited. */
export const ChatUsage: React.FC = () => {
  const { t } = useTranslation()
  const usage = useSelector((state: State) => state.chat.usage)
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null)
  const [hovered, setHovered] = React.useState(false)

  if (!usage || (usage.session.unlimited && usage.weekly.unlimited)) return null

  const worst = Math.max(pct(usage.session), pct(usage.weekly))
  const color = worst >= 90 ? 'error' : worst >= 70 ? 'warning' : 'primary'

  return (
    <>
      {/* The app's tooltip rather than the DOM's `title`: same treatment as every
          other icon button (see buttons/IconButton), and the ring carries no label
          of its own. Above, because the button sits in the composer at the foot.

          Open is driven rather than left to the hover default: the popover opens
          into the same space, and the pointer is still over the button when it
          does — so the label has to stand down while the detail is showing. */}
      <Tooltip
        title={t('chat.usage', 'Usage')}
        placement="top"
        arrow
        open={hovered && !anchorEl}
        onOpen={() => setHovered(true)}
        onClose={() => setHovered(false)}
      >
        <MuiIconButton size="large" onClick={e => setAnchorEl(e.currentTarget)} sx={{ padding: 1 }}>
          <UsageRing value={worst} color={color} />
        </MuiIconButton>
      </Tooltip>
      <Popover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 260, padding: 2 } } }}
      >
        <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
          {t('chat.usageTitle', 'Usage')}
        </Typography>
        <WindowRow label={t('chat.usageSession', '5-hour session')} window={usage.session} gutterBottom />
        <WindowRow label={t('chat.usageWeekly', 'This week')} window={usage.weekly} />
      </Popover>
    </>
  )
}
