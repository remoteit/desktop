import React from 'react'
import { Box, Tooltip, TooltipProps, BoxProps, Button } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { useStyles } from './GuideStep'
import { Link } from './Link'

type Props = {
  guide: string
  placement?: TooltipProps['placement']
  instructions: React.ReactNode
  component?: BoxProps['component']
  startDate?: Date // Show to users created before this date
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
  const expired = useSelector(
    (state: State) => (startDate > state.user.created && !state.ui.testUI) || state.ui.expireBubbles
  )
  const poppedBubbles = useSelector((state: State) => state.ui.poppedBubbles)
  const sidebarOpen = useSelector((state: State) => state.ui.sidebarMenu)
  const [waiting, setWaiting] = React.useState<boolean>(true)
  const hideForSidebar = sidebarOpen && !sidebar
  const queued = !!queueAfter && !poppedBubbles.includes(queueAfter)
  const open: boolean = !hide && !poppedBubbles.includes(guide) && !expired && !waiting && !queued && !hideForSidebar
  const css = useStyles({ highlight: highlight && open })

  React.useEffect(() => {
    const timeout = setTimeout(() => setWaiting(false), enterDelay || 0)
    return () => clearTimeout(timeout)
  }, [])

  if (!open) return <>{children}</>

  return (
    <Tooltip
      classes={{ tooltip: css.tip, arrow: css.arrow }}
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
      <Box className={css.box} sx={sx} onClick={() => ui.pop(guide)} component={component}>
        {children}
      </Box>
    </Tooltip>
  )
}
