import React from 'react'
import { Box, Tooltip, TooltipProps, BoxProps, Button } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { tipSx, arrowSx, boxSx } from './GuideStep'
import { toSxArray } from '../styling'
import { Link } from './Link'

/* "Dismiss all" used to be permanent AND retroactive: one boolean hid every bubble ever
   written, including ones added long afterwards, so a single click quietly opted the user
   out of all future onboarding. It now records WHEN it happened, and a bubble introduced
   after that moment still gets its chance.

   A legacy `true` is read as a dismissal dated to the release that made this change — so
   everything that existed then stays dismissed, and only genuinely newer bubbles return. */
const DISMISSAL_DATED_FROM = new Date('2026-08-01').getTime()

const dismissedAt = (value: number | boolean): number | undefined =>
  value === true ? DISMISSAL_DATED_FROM : typeof value === 'number' ? value : undefined

type Props = {
  guide: string
  placement?: TooltipProps['placement']
  instructions: React.ReactNode
  component?: BoxProps['component']
  startDate?: Date // Cohort gate: hidden from users who signed up before this date
  /** When this bubble shipped. A "dismiss all" older than this does not hide it.
   *  Defaults to startDate, so existing bubbles keep their current behaviour. */
  added?: Date
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
  const { ui } = useDispatch<Dispatch>()
  const cohortExpired = useSelector(
    (state: State) => startDate > state.user.created && !state.ui.testUI
  )
  const dismissed = useSelector((state: State) => dismissedAt(state.ui.expireBubbles))
  // Dismissed only counts against bubbles that already existed when it happened
  const expired = cohortExpired || (dismissed !== undefined && (added ?? startDate).getTime() <= dismissed)
  const poppedBubbles = useSelector((state: State) => state.ui.poppedBubbles)
  const sidebarOpen = useSelector((state: State) => state.ui.sidebarMenu)
  const [waiting, setWaiting] = React.useState<boolean>(true)
  const hideForSidebar = sidebarOpen && !sidebar
  const queued = !!queueAfter && !poppedBubbles.includes(queueAfter)
  const open: boolean = !hide && !poppedBubbles.includes(guide) && !expired && !waiting && !queued && !hideForSidebar

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
              Ok
            </Button>
            <Link onClick={() => ui.popAll()}>dismiss all</Link>
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
