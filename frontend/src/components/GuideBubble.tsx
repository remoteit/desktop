import React from 'react'
import { Box, Tooltip, TooltipProps, BoxProps, Button } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { useStyles } from './GuideStep'

type Props = {
  guide: string
  placement?: TooltipProps['placement']
  instructions: React.ReactNode
  component?: BoxProps['component']
  startDate?: Date
  highlight?: boolean
  hideArrow?: boolean
  hide?: boolean
  enterDelay?: number
  queueAfter?: string
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
  sx,
  children,
}) => {
  const { poppedBubbles, expired } = useSelector((state: ApplicationState) => ({
    poppedBubbles: state.ui.poppedBubbles,
    expired: startDate > state.user.created && !state.ui.unExpireBubbles && !state.ui.testUI,
  }))
  const { ui } = useDispatch<Dispatch>()
  const [waiting, setWaiting] = React.useState<boolean>(true)
  const queued = !!queueAfter && !poppedBubbles.includes(queueAfter)
  const open: boolean = !hide && !poppedBubbles.includes(guide) && !expired && !waiting && !queued
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
          <Button size="small" variant="text" onClick={() => ui.pop(guide)}>
            Ok
          </Button>
          {/* <Box fontSize={10} marginLeft={2} component="span">
            {guide}
          </Box> */}
        </>
      }
    >
      <Box className={css.box} sx={sx} onClick={() => ui.pop(guide)} component={component}>
        {children}
      </Box>
    </Tooltip>
  )
}
