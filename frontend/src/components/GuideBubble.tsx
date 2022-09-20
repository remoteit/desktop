import React from 'react'
import { Box, Tooltip, Typography, TooltipProps, BoxProps, Button } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { IconButton } from '../buttons/IconButton'
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
  children,
}) => {
  const { poppedBubbles, expired } = useSelector((state: ApplicationState) => ({
    poppedBubbles: state.ui.poppedBubbles,
    expired: startDate > state.user.created,
  }))
  const { ui } = useDispatch<Dispatch>()
  const [waiting, setWaiting] = React.useState<boolean>(true)
  const open: boolean = !hide && !poppedBubbles.includes(guide) && !expired && !waiting
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
          <Typography variant="body1" gutterBottom>
            {instructions}
          </Typography>
          <Button size="small" variant="text" onClick={() => ui.pop(guide)}>
            Ok
          </Button>
        </>
      }
    >
      <Box className={css.box} onClick={() => ui.pop(guide)} component={component}>
        {children}
      </Box>
    </Tooltip>
  )
}
