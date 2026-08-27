import React from 'react'
import { Box, Tooltip, TooltipProps, BoxProps, Button, Theme, alpha } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { State, Dispatch } from '../store'
import { spacing, radius, fontSizes, toSxArray } from '../styling'
import { Link } from './Link'

const boxSx = (highlight?: boolean) => (theme: Theme) => ({
  border: highlight ? `1px dotted ${theme.palette.guide.main}` : undefined,
  borderRadius: `${radius.lg}px`,
  position: 'relative' as const,
})

const arrowSx = (theme: Theme) => ({ color: theme.palette.guide.main })

const tipSx = (theme: Theme) => ({
  backgroundColor: theme.palette.guide.main,
  color: theme.palette.white.main,
  fontSize: fontSizes.lg,
  padding: `${spacing.lg}px`,
  paddingRight: `${spacing.xl}px`,
  margin: `${spacing.lg}px`,
  position: 'relative',
  borderRadius: `${radius.lg}px`,
  '& .MuiTypography-caption': { color: theme.palette.white.main, marginTop: `${spacing.md}px`, display: 'block' },
  '& .MuiLink-root': {
    color: theme.palette.white.main,
    marginRight: `${-spacing.sm}px`,
    textDecoration: 'none',
    fontSize: fontSizes.xs,
    fontWeight: 400,
    cursor: 'pointer',
    opacity: 0.3,
  },
  '& .MuiLink-root:hover': { opacity: 1 },
  '& .IconButtonTooltip': { position: 'absolute', right: `${spacing.xs}px`, top: `${spacing.xs}px` },
  '& .MuiButton-root': { background: alpha(theme.palette.white.main, 0.15), color: theme.palette.white.main },
  '& .MuiButton-root:hover': { background: alpha(theme.palette.white.main, 0.3) },
  '& cite': {
    fontStyle: 'normal',
    textTransform: 'uppercase',
    fontWeight: 700,
    fontSize: '0.8em',
    letterSpacing: 1,
    paddingLeft: `${spacing.xs}px`,
    paddingRight: `${spacing.xs}px`,
  },
})

/* "Dismiss all" used to be permanent AND retroactive: one boolean hid every bubble ever
   written, including ones added long afterwards, so a single click quietly opted the user
   out of all future onboarding. It now records WHEN it happened, and a bubble introduced
   after that moment still gets its chance.

   A legacy `true` is read as a dismissal dated to the release that made this change — so
   everything that existed then stays dismissed, and only genuinely newer bubbles return. */
const DISMISSAL_DATED_FROM = new Date('2026-08-01').getTime()

const dismissedAt = (value: number | boolean): number | undefined =>
  value === true ? DISMISSAL_DATED_FROM : typeof value === 'number' ? value : undefined

/* Bubbles queue behind one another (queueAfter), so dismissing one is often what
   makes the next appear. Every rendered bubble registers here — open or not — so an
   open bubble can tell whether its successor is on the current screen and label its
   button "Next" instead of "Ok". A successor on another page stays "Ok": dismissing
   would not visibly advance anything. */
type Registration = { guide: string; queueAfter?: string; hide?: boolean }
const mountedBubbles = new Set<Registration>()
const bubbleListeners = new Set<() => void>()
const notifyBubbles = () => bubbleListeners.forEach(listener => listener())
const subscribeBubbles = (listener: () => void) => {
  bubbleListeners.add(listener)
  return () => {
    bubbleListeners.delete(listener)
  }
}

type Props = {
  guide: string
  placement?: TooltipProps['placement']
  instructions: React.ReactNode
  component?: BoxProps['component']
  startDate?: Date // Cohort gate: hidden from users who signed up before this date
  /** When this bubble shipped. A "dismiss all" older than this does not hide it —
   *  required so a new bubble can't silently inherit an old dismissal. */
  added: Date
  highlight?: boolean
  hideArrow?: boolean
  hide?: boolean
  enterDelay?: number
  queueAfter?: string
  sidebar?: boolean
  sx?: BoxProps['sx']
  children?: React.ReactNode
}

export const GuideBubble: React.FC<Props> = ({
  guide,
  placement,
  instructions,
  startDate = new Date(0),
  added,
  component = 'div',
  highlight,
  hideArrow,
  hide,
  enterDelay,
  queueAfter,
  sidebar,
  sx,
  children,
}) => {
  const { t } = useTranslation()
  const { ui } = useDispatch<Dispatch>()
  const cohortExpired = useSelector((state: State) => {
    // An explicit "Reset interactive guides" re-anchors the cohort to the reset
    // moment, so even accounts that predate the guides get onboarded again
    const cohortAnchor = Math.max(state.user.created.getTime(), state.ui.guidesResetDate || 0)
    return startDate.getTime() > cohortAnchor && !state.ui.testUI
  })
  const dismissed = useSelector((state: State) => dismissedAt(state.ui.expireBubbles))
  // Dismissed only counts against bubbles that already existed when it happened
  const expired = cohortExpired || (dismissed !== undefined && added.getTime() <= dismissed)
  const poppedBubbles = useSelector((state: State) => state.ui.poppedBubbles)
  const sidebarOpen = useSelector((state: State) => state.ui.sidebarMenu)
  const [waiting, setWaiting] = React.useState<boolean>(true)
  const hideForSidebar = sidebarOpen && !sidebar
  const queued = !!queueAfter && !poppedBubbles.includes(queueAfter)
  const open: boolean = !hide && !poppedBubbles.includes(guide) && !expired && !waiting && !queued && !hideForSidebar

  const registration = React.useRef<Registration>({ guide, queueAfter, hide }).current
  registration.queueAfter = queueAfter
  registration.hide = hide

  React.useEffect(() => {
    mountedBubbles.add(registration)
    notifyBubbles()
    return () => {
      mountedBubbles.delete(registration)
      notifyBubbles()
    }
  }, [])

  React.useEffect(() => notifyBubbles(), [queueAfter, hide])

  // Joined to a string so the snapshot stays referentially stable between renders
  const successors = React.useSyncExternalStore(subscribeBubbles, () =>
    Array.from(mountedBubbles)
      .filter(bubble => bubble.queueAfter === guide && !bubble.hide)
      .map(bubble => bubble.guide)
      .sort()
      .join()
  )
  const hasNext = !!successors && successors.split(',').some(name => !poppedBubbles.includes(name))

  React.useEffect(() => {
    const timeout = setTimeout(() => setWaiting(false), enterDelay || 0)
    return () => clearTimeout(timeout)
  }, [])

  if (!open) return <>{children}</>

  return (
    <Tooltip
      slotProps={{ tooltip: { sx: tipSx }, arrow: { sx: arrowSx } }}
      open={open}
      arrow={!hideArrow}
      placement={placement || 'top'}
      title={
        <>
          {instructions}
          <Box display="flex" alignItems="flex-end" justifyContent="space-between">
            <Button size="small" variant="text" onClick={() => ui.pop(guide)}>
              {hasNext ? t('common.next', 'Next') : t('common.ok', 'Ok')}
            </Button>
            <Link onClick={() => ui.popAll()}>{t('guideBubble.dismissAll', 'dismiss all')}</Link>
          </Box>
        </>
      }
    >
      <Box
        sx={[boxSx(highlight && open), ...toSxArray(sx)]}
        onClick={() => ui.pop(guide)}
        component={component}
      >
        {children}
      </Box>
    </Tooltip>
  )
}
